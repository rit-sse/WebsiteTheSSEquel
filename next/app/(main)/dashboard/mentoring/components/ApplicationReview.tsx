"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Check,
  X,
  Eye,
  Mail,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react"

interface MentorApplication {
  id: number
  discordUsername: string
  pronouns: string
  major: string
  yearLevel: string
  coursesJson: string
  skillsText: string
  toolsComfortable: string
  toolsLearning: string
  previousSemesters: number
  whyMentor: string
  comments: string | null
  status: string
  createdAt: string
  user: {
    id: number
    name: string
    email: string
    image: string
  }
  semester: {
    id: number
    name: string
  }
}

interface MentorSemester {
  id: number
  name: string
  isActive: boolean
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/20 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/20 text-red-700 dark:text-red-400",
  invited: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
}

export default function ApplicationReview() {
  const [applications, setApplications] = useState<MentorApplication[]>([])
  const [semesters, setSemesters] = useState<MentorSemester[]>([])
  const [selectedSemester, setSelectedSemester] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewApplication, setViewApplication] = useState<MentorApplication | null>(null)

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteApplication, setInviteApplication] = useState<MentorApplication | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const fetchSemesters = useCallback(async () => {
    try {
      const response = await fetch("/api/mentor-semester")
      if (response.ok) {
        const data = await response.json()
        setSemesters(data)
        // Default to active semester
        const active = data.find((s: MentorSemester) => s.isActive)
        if (active) {
          setSelectedSemester(active.id.toString())
        }
      }
    } catch (error) {
      console.error("Failed to fetch semesters:", error)
    }
  }, [])

  const fetchApplications = useCallback(async () => {
    try {
      let url = "/api/mentor-application"
      const params = new URLSearchParams()
      if (selectedSemester !== "all") {
        params.set("semesterId", selectedSemester)
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus)
      }
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSemester, selectedStatus])

  useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  useEffect(() => {
    setIsLoading(true)
    fetchApplications()
  }, [fetchApplications])

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch("/api/mentor-application", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Application ${newStatus}`)
        fetchApplications()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update application")
      }
    } catch (error) {
      console.error("Failed to update application:", error)
      toast.error("An error occurred")
    }
  }

  const handleSendInvite = async () => {
    if (!inviteApplication) return

    setIsInviting(true)
    try {
      // Send the mentor invitation (applicationId will auto-update application status)
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteApplication.user.email,
          type: "mentor",
          endDate: expirationDate.toISOString(),
          applicationId: inviteApplication.id,
        }),
      })

      if (response.ok) {
        toast.success(`Invitation sent to ${inviteApplication.user.name}`)
        fetchApplications()
        setInviteModalOpen(false)
        setInviteApplication(null)
      } else {
        const data = await response.json()
        if (data.needsGmailAuth) {
          toast.warning("Invitation created but email not sent - Gmail authorization required")
          fetchApplications()
          setInviteModalOpen(false)
          setInviteApplication(null)
        } else {
          toast.error(data.error || "Failed to send invitation")
        }
      }
    } catch (error) {
      console.error("Failed to send invitation:", error)
      toast.error("An error occurred")
    } finally {
      setIsInviting(false)
    }
  }

  const toggleRowExpand = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const parseCourses = (coursesJson: string): string[] => {
    try {
      return JSON.parse(coursesJson)
    } catch {
      return []
    }
  }

  const columns: Column<MentorApplication>[] = [
    {
      key: "expand",
      header: "",
      className: "w-[40px]",
      render: (app) => (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => toggleRowExpand(app.id)}
        >
          {expandedRows.has(app.id) ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      key: "applicant",
      header: "Applicant",
      sortable: true,
      render: (app) => (
        <div className="flex items-center gap-3">
          <img
            src={app.user.image}
            alt={app.user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-sm">{app.user.name}</p>
            <p className="text-xs text-muted-foreground">{app.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (app) => (
        <div className="text-sm">
          <p>{app.major} • {app.yearLevel}</p>
          <p className="text-xs text-muted-foreground">
            {parseCourses(app.coursesJson).length} courses • {app.previousSemesters} prev semesters
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (app) => (
        <Badge className={STATUS_COLORS[app.status] || ""}>
          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Applied",
      className: "hidden md:table-cell",
      render: (app) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(app.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (app) => (
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setViewApplication(app)
              setViewModalOpen(true)
            }}
            title="View details"
          >
            <Eye className="h-3 w-3" />
          </Button>
          {app.status === "pending" && (
            <>
              <Button
                size="xs"
                variant="ghost"
                className="text-green-600 hover:text-green-700"
                onClick={() => handleUpdateStatus(app.id, "approved")}
                title="Approve"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleUpdateStatus(app.id, "rejected")}
                title="Reject"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
          {app.status === "approved" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setInviteApplication(app)
                setInviteModalOpen(true)
              }}
              title="Send invite"
            >
              <UserPlus className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    invited: applications.filter((a) => a.status === "invited").length,
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Loading applications...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Semester:</span>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name} {s.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {stats.total} total
          </span>
          <Badge variant="outline" className={STATUS_COLORS.pending}>
            {stats.pending} pending
          </Badge>
          <Badge variant="outline" className={STATUS_COLORS.approved}>
            {stats.approved} approved
          </Badge>
        </div>
      </div>

      <DataTable
        data={applications}
        columns={columns}
        keyField="id"
        searchPlaceholder="Search applications..."
        emptyMessage="No applications found"
        expandedContent={(app) =>
          expandedRows.has(app.id) ? (
            <div className="px-4 py-3 bg-muted/30 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Discord</p>
                  <p className="text-muted-foreground">{app.discordUsername}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Pronouns</p>
                  <p className="text-muted-foreground">{app.pronouns}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium mb-1">Courses Taken</p>
                  <div className="flex flex-wrap gap-1">
                    {parseCourses(app.coursesJson).map((course) => (
                      <Badge key={course} variant="secondary" className="text-xs">
                        {course}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="font-medium mb-1">Why they want to mentor</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {app.whyMentor}
                  </p>
                </div>
              </div>
            </div>
          ) : null
        }
      />

      {/* View Modal */}
      <Modal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        title="Application Details"
        className="max-w-2xl"
      >
        {viewApplication && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <img
                src={viewApplication.user.image}
                alt={viewApplication.user.name}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-lg">{viewApplication.user.name}</h3>
                <p className="text-muted-foreground">{viewApplication.user.email}</p>
                <Badge className={STATUS_COLORS[viewApplication.status]}>
                  {viewApplication.status.charAt(0).toUpperCase() + viewApplication.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Discord</p>
                <p className="text-muted-foreground">{viewApplication.discordUsername}</p>
              </div>
              <div>
                <p className="font-medium">Pronouns</p>
                <p className="text-muted-foreground">{viewApplication.pronouns}</p>
              </div>
              <div>
                <p className="font-medium">Major</p>
                <p className="text-muted-foreground">{viewApplication.major}</p>
              </div>
              <div>
                <p className="font-medium">Year Level</p>
                <p className="text-muted-foreground">{viewApplication.yearLevel}</p>
              </div>
              <div>
                <p className="font-medium">Previous Semesters</p>
                <p className="text-muted-foreground">{viewApplication.previousSemesters}</p>
              </div>
              <div>
                <p className="font-medium">Applied</p>
                <p className="text-muted-foreground">{formatDate(viewApplication.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-sm mb-2">Courses Taken</p>
              <div className="flex flex-wrap gap-1">
                {parseCourses(viewApplication.coursesJson).map((course) => (
                  <Badge key={course} variant="secondary" className="text-xs">
                    {course}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Other Skills</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewApplication.skillsText || "—"}
              </p>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Tools Comfortable With</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewApplication.toolsComfortable || "—"}
              </p>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Tools Currently Learning</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewApplication.toolsLearning || "—"}
              </p>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Why They Want to Mentor</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewApplication.whyMentor}
              </p>
            </div>

            {viewApplication.comments && (
              <div>
                <p className="font-medium text-sm mb-1">Additional Comments</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {viewApplication.comments}
                </p>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
          {viewApplication && viewApplication.status === "pending" && (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  handleUpdateStatus(viewApplication.id, "rejected")
                  setViewModalOpen(false)
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  handleUpdateStatus(viewApplication.id, "approved")
                  setViewModalOpen(false)
                }}
              >
                Approve
              </Button>
            </>
          )}
          {viewApplication && viewApplication.status === "approved" && (
            <Button
              onClick={() => {
                setInviteApplication(viewApplication)
                setViewModalOpen(false)
                setInviteModalOpen(true)
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Invite Modal */}
      <Modal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        title="Send Mentor Invitation"
        className="max-w-md"
      >
        {inviteApplication && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a mentor invitation to <strong>{inviteApplication.user.name}</strong> at{" "}
              <strong>{inviteApplication.user.email}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              They will receive an email with instructions to accept the invitation and become
              an active mentor.
            </p>
          </div>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite} disabled={isInviting}>
            {isInviting ? "Sending..." : "Send Invitation"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
