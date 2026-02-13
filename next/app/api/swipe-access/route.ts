import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendEmail, isEmailConfigured } from "@/lib/email"

export const dynamic = "force-dynamic"

interface SwipeAccessPerson {
  name: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const loggedInUser = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        officers: {
          where: { is_active: true },
          select: { id: true },
        },
      },
    })

    if (!loggedInUser || loggedInUser.officers.length === 0) {
      return NextResponse.json(
        { error: "Only active officers can request swipe access" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { people, context } = body as {
      people?: SwipeAccessPerson[]
      context?: string
    }

    if (!people || people.length === 0) {
      return NextResponse.json(
        { error: "No people provided for swipe access request" },
        { status: 400 }
      )
    }

    const subjectContext = context ? ` - ${context}` : ""
    const subject = `SSE Swipe Access Request${subjectContext}`
    const peopleList = people
      .map((person) => `${person.name} (${person.email})`)
      .join("<br/>")
    const textList = people
      .map((person) => `${person.name} (${person.email})`)
      .join("\n")

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured on this environment" },
        { status: 500 }
      )
    }

    await sendEmail({
      to: "softwareengineering@rit.edu",
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Swipe Access Request</h2>
          <p>Please add swipe access for the following people:</p>
          <div style="margin: 16px 0; padding: 12px; border: 1px solid #ddd; border-radius: 6px;">
            ${peopleList}
          </div>
          <p style="color: #666; font-size: 12px;">
            Sent by ${loggedInUser.name} via the SSE website.
          </p>
        </div>
      `,
      text: `Swipe Access Request\n\nPlease add swipe access for the following people:\n${textList}\n\nSent by ${loggedInUser.name} via the SSE website.`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending swipe access email:", error)
    return NextResponse.json(
      { error: "Failed to send swipe access email" },
      { status: 500 }
    )
  }
}
