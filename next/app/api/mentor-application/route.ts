import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Prisma } from "@prisma/client"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { MENTOR_HEAD_TITLE } from "@/lib/utils"
import { resolveUserImage } from "@/lib/s3Utils"

export const dynamic = "force-dynamic"

/**
 * Check if the current user can manage mentor applications
 * (Must be Mentoring Head or Primary Officer)
 */
async function canManageApplications(userEmail: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    select: {
      officers: {
        where: { is_active: true },
        select: {
          position: {
            select: {
              title: true,
              is_primary: true,
            },
          },
        },
      },
    },
  })

  if (!user) return false

  return user.officers.some(
    (officer) =>
      officer.position.title === MENTOR_HEAD_TITLE ||
      officer.position.is_primary
  )
}

/**
 * HTTP GET request to /api/mentor-application
 * Returns applications (filtered by semester, status, or user)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")
  const semesterId = searchParams.get("semesterId")
  const status = searchParams.get("status")
  const userId = searchParams.get("userId")
  const myApplications = searchParams.get("my") === "true"

  try {
    const session = await getServerSession(authOptions)

    // If fetching own applications
    if (myApplications) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const applications = await prisma.mentorApplication.findMany({
        where: { userId: user.id },
        include: {
          semester: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json(applications)
    }

    // For single application by ID
    if (id) {
      const application = await prisma.mentorApplication.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageKey: true,
              googleImageURL: true,
            },
          },
          semester: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 })
      }

      // Check if user owns this application or can manage
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        })
        const canManage = await canManageApplications(session.user.email)
        
        if (!canManage && user?.id !== application.userId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const applicationWithImage = {
        ...application,
        user: {
          ...application.user,
          image: resolveUserImage(
            application.user.profileImageKey,
            application.user.googleImageURL
          ),
        },
      }

      return NextResponse.json(applicationWithImage)
    }

    // For listing applications (requires management permission)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageApplications(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can view all applications" },
        { status: 403 }
      )
    }

    const where: Prisma.MentorApplicationWhereInput = {}

    if (semesterId) where.semesterId = parseInt(semesterId)
    if (status) {
      if (status === "invited") {
        where.AND = [
          { status: "invited" },
          {
            user: {
              mentor: {
                none: { isActive: true },
              },
            },
          },
        ]
      } else {
        where.status = status
      }
    } else {
      // Keep accepted/closed applications out of the review queue by default.
      where.NOT = [
        { status: "closed" },
        {
          AND: [
            { status: "invited" },
            {
              user: {
                mentor: {
                  some: { isActive: true },
                },
              },
            },
          ],
        },
      ]
    }
    if (userId) where.userId = parseInt(userId)

    const applications = await prisma.mentorApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageKey: true,
            googleImageURL: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const applicationsWithImage = applications.map((application) => ({
      ...application,
      user: {
        ...application.user,
        image: resolveUserImage(
          application.user.profileImageKey,
          application.user.googleImageURL
        ),
      },
    }))

    return NextResponse.json(applicationsWithImage)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

/**
 * HTTP POST request to /api/mentor-application
 * Submit a new mentor application (requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - please sign in" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      semesterId,
      discordUsername,
      pronouns,
      major,
      yearLevel,
      coursesJson,
      skillsText,
      toolsComfortable,
      toolsLearning,
      previousSemesters,
      whyMentor,
      comments,
    } = body

    // Validate required fields
    if (!semesterId) {
      return NextResponse.json({ error: "Semester is required" }, { status: 400 })
    }

    // Check if semester exists and is accepting applications
    const semester = await prisma.mentorSemester.findUnique({
      where: { id: semesterId },
    })

    if (!semester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    // Check if applications are open
    const now = new Date()
    if (semester.applicationOpen && now < semester.applicationOpen) {
      return NextResponse.json(
        { error: "Applications have not opened yet" },
        { status: 400 }
      )
    }
    if (semester.applicationClose && now > semester.applicationClose) {
      return NextResponse.json(
        { error: "Applications have closed" },
        { status: 400 }
      )
    }

    // Check if user already applied for this semester
    const existingApplication = await prisma.mentorApplication.findUnique({
      where: {
        userId_semesterId: {
          userId: user.id,
          semesterId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this semester" },
        { status: 409 }
      )
    }

    // Validate required form fields
    if (!discordUsername?.trim()) {
      return NextResponse.json({ error: "Discord username is required" }, { status: 400 })
    }
    if (!pronouns?.trim()) {
      return NextResponse.json({ error: "Pronouns are required" }, { status: 400 })
    }
    if (!major?.trim()) {
      return NextResponse.json({ error: "Major is required" }, { status: 400 })
    }
    if (!yearLevel?.trim()) {
      return NextResponse.json({ error: "Year level is required" }, { status: 400 })
    }
    if (!whyMentor?.trim()) {
      return NextResponse.json({ error: "Please explain why you want to be a mentor" }, { status: 400 })
    }

    // Create the application
    const application = await prisma.mentorApplication.create({
      data: {
        userId: user.id,
        semesterId,
        discordUsername: discordUsername.trim(),
        pronouns: pronouns.trim(),
        major: major.trim(),
        yearLevel: yearLevel.trim(),
        coursesJson: coursesJson || "[]",
        skillsText: skillsText?.trim() || "",
        toolsComfortable: toolsComfortable?.trim() || "",
        toolsLearning: toolsLearning?.trim() || "",
        previousSemesters: parseInt(previousSemesters) || 0,
        whyMentor: whyMentor.trim(),
        comments: comments?.trim() || null,
        status: "pending",
      },
      include: {
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    )
  }
}

/**
 * HTTP PUT request to /api/mentor-application
 * Update application status (approve/reject)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageApplications(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can update applications" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    if (!status || !["pending", "approved", "rejected", "invited", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (pending, approved, rejected, invited, closed)" },
        { status: 400 }
      )
    }

    // Check if application exists
    const existingApplication = await prisma.mentorApplication.findUnique({
      where: { id },
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const application = await prisma.mentorApplication.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageKey: true,
            googleImageURL: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const applicationWithImage = {
      ...application,
      user: {
        ...application.user,
        image: resolveUserImage(
          application.user.profileImageKey,
          application.user.googleImageURL
        ),
      },
    }

    return NextResponse.json(applicationWithImage)
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

/**
 * HTTP PATCH request to /api/mentor-application
 * Allow applicants to edit their own application answers (non-status fields)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      id,
      discordUsername,
      pronouns,
      major,
      yearLevel,
      coursesJson,
      skillsText,
      toolsComfortable,
      toolsLearning,
      previousSemesters,
      whyMentor,
      comments,
    } = body ?? {}

    if (!id || Number.isNaN(Number(id))) {
      return NextResponse.json({ error: "Valid application id is required" }, { status: 400 })
    }

    const existingApplication = await prisma.mentorApplication.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (existingApplication.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!discordUsername?.trim()) {
      return NextResponse.json({ error: "Discord username is required" }, { status: 400 })
    }
    if (!pronouns?.trim()) {
      return NextResponse.json({ error: "Pronouns are required" }, { status: 400 })
    }
    if (!major?.trim()) {
      return NextResponse.json({ error: "Major is required" }, { status: 400 })
    }
    if (!yearLevel?.trim()) {
      return NextResponse.json({ error: "Year level is required" }, { status: 400 })
    }
    if (!whyMentor?.trim()) {
      return NextResponse.json({ error: "Please explain why you want to be a mentor" }, { status: 400 })
    }

    const parsedPreviousSemesters = Number.parseInt(String(previousSemesters), 10)
    const safePreviousSemesters = Number.isNaN(parsedPreviousSemesters)
      ? 0
      : Math.max(0, Math.min(parsedPreviousSemesters, 5))

    const updated = await prisma.mentorApplication.update({
      where: { id: Number(id) },
      data: {
        discordUsername: discordUsername.trim(),
        pronouns: pronouns.trim(),
        major: major.trim(),
        yearLevel: yearLevel.trim(),
        coursesJson: typeof coursesJson === "string" ? coursesJson : "[]",
        skillsText: (skillsText ?? "").trim(),
        toolsComfortable: (toolsComfortable ?? "").trim(),
        toolsLearning: (toolsLearning ?? "").trim(),
        previousSemesters: safePreviousSemesters,
        whyMentor: whyMentor.trim(),
        comments: comments?.trim() || null,
      },
      include: {
        semester: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error patching application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

/**
 * HTTP DELETE request to /api/mentor-application
 * Delete an application (user can delete their own pending application)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if application exists
    const existingApplication = await prisma.mentorApplication.findUnique({
      where: { id },
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Users can only delete their own pending applications
    const canManage = await canManageApplications(session.user.email)
    if (!canManage) {
      if (existingApplication.userId !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      if (existingApplication.status !== "pending") {
        return NextResponse.json(
          { error: "Can only withdraw pending applications" },
          { status: 400 }
        )
      }
    }

    await prisma.mentorApplication.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    )
  }
}
