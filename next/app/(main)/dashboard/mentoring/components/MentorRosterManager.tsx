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
import { Pencil, Trash2, UserCheck, UserX, Mail, Clock } from "lucide-react"
import MentorInviteModal from "../../MentorInviteModal"

interface Mentor {
  id: number
  isActive: boolean
  expirationDate: string
  user: {
    id: number
    name: string
    email: string
    image: string
    description: string | null
    linkedIn: string | null
    gitHub: string | null
  }
  mentorSkill?: {
    skill: {
      id: number
      skill: string
    }
  }[]
  courseTaken?: {
    course: {
      id: number
      title: string
      code: number
      department: {
        id: number
        title: string
        shortTitle: string
      }
    }
  }[]
  scheduleBlocks?: {
    id: number
    weekday: number
    startHour: number
    scheduleId: number
  }[]
}

interface PendingInvitation {
  id: number
  invitedEmail: string
  type: string
  endDate: string | null
  createdAt: string
  expiresAt: string
  inviter: {
    id: number
    name: string
    email: string
  }
}

export default function MentorRosterManager() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editMentor, setEditMentor] = useState<Mentor | null>(null)
  const [editIsActive, setEditIsActive] = useState(true)
  const [editExpirationDate, setEditExpirationDate] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteMentor, setDeleteMentor] = useState<Mentor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [cancelInvitation, setCancelInvitation] = useState<PendingInvitation | null>(null)
  const [isCancellingInvitation, setIsCancellingInvitation] = useState(false)
  const [isSendingSwipe, setIsSendingSwipe] = useState(false)
  const [swipeModalOpen, setSwipeModalOpen] = useState(false)

  // Fetch mentors with details
  const fetchMentors = useCallback(async () => {
    try {
      const response = await fetch("/api/mentor?detailed=true")
      if (response.ok) {
        const data = await response.json()
        setMentors(data)
      }
    } catch (error) {
      console.error("Failed to fetch mentors:", error)
    }
  }, [])

  // Fetch pending mentor invitations
  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations?type=mentor")
      if (response.ok) {
        const data = await response.json()
        setPendingInvitations(data)
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchMentors(), fetchInvitations()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchMentors, fetchInvitations])

  // Handle cancel invitation
  const handleCancelInvitation = async () => {
    if (!cancelInvitation) return

    setIsCancellingInvitation(true)
    try {
      const response = await fetch("/api/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cancelInvitation.id }),
      })

      if (response.ok) {
        toast.success("Invitation cancelled")
        fetchInvitations()
        setCancelInvitation(null)
      } else {
        const text = await response.text()
        toast.error(text || "Failed to cancel invitation")
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
      toast.error("An error occurred")
    } finally {
      setIsCancellingInvitation(false)
    }
  }

  // Handle open edit modal
  const handleOpenEditModal = (mentor: Mentor) => {
    setEditMentor(mentor)
    setEditIsActive(mentor.isActive)
    setEditExpirationDate(mentor.expirationDate.split("T")[0])
    setEditModalOpen(true)
  }

  // Handle edit mentor
  const handleEditMentor = async () => {
    if (!editMentor) return

    setIsEditing(true)
    try {
      const response = await fetch("/api/mentor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editMentor.id,
          isActive: editIsActive,
          expirationDate: new Date(editExpirationDate).toISOString(),
        }),
      })

      if (response.ok) {
        toast.success("Mentor updated successfully")
        fetchMentors()
        setEditModalOpen(false)
        setEditMentor(null)
      } else {
        const text = await response.text()
        toast.error(text || "Failed to update mentor")
      }
    } catch (error) {
      console.error("Failed to update mentor:", error)
      toast.error("An error occurred")
    } finally {
      setIsEditing(false)
    }
  }

  // Handle toggle active status
  const handleToggleActive = async (mentor: Mentor) => {
    try {
      const response = await fetch("/api/mentor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mentor.id,
          isActive: !mentor.isActive,
        }),
      })

      if (response.ok) {
        toast.success(mentor.isActive ? "Mentor deactivated" : "Mentor activated")
        fetchMentors()
      } else {
        const text = await response.text()
        toast.error(text || "Failed to update mentor")
      }
    } catch (error) {
      console.error("Failed to toggle mentor:", error)
      toast.error("An error occurred")
    }
  }

  const handleSendSwipeAccess = async () => {
    const people = activeMentors.map((mentor) => ({
      name: mentor.user.name,
      email: mentor.user.email,
    }))

    if (people.length === 0) {
      toast.error("No active mentors to include in swipe request")
      return
    }

    setIsSendingSwipe(true)
    try {
      const response = await fetch("/api/swipe-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "Mentor Roster",
          people,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Swipe access request sent")
      } else {
        if (data.needsGmailAuth) {
          toast.warning(
            data.message ||
              "Swipe request created but Gmail authorization is required to send"
          )
        } else {
          toast.error(data.error || "Failed to send swipe access request")
        }
      }
    } catch (error) {
      console.error("Failed to send swipe access request:", error)
      toast.error("An error occurred while sending swipe request")
    } finally {
      setIsSendingSwipe(false)
    }
  }

  // Handle delete mentor
  const handleDeleteMentor = async () => {
    if (!deleteMentor) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/mentor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteMentor.id }),
      })

      if (response.ok) {
        toast.success("Mentor removed")
        fetchMentors()
        setDeleteModalOpen(false)
        setDeleteMentor(null)
      } else {
        const text = await response.text()
        toast.error(text || "Failed to remove mentor")
      }
    } catch (error) {
      console.error("Failed to delete mentor:", error)
      toast.error("An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  // Format expiration date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Check if expiration is approaching (within 30 days)
  const isExpirationApproaching = (dateStr: string) => {
    const expiration = new Date(dateStr)
    const now = new Date()
    const daysUntil = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30 && daysUntil > 0
  }

  // Check if expired
  const isExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date()
  }

  // Separate active and inactive mentors
  const activeMentors = mentors.filter((m) => m.isActive)
  const inactiveMentors = mentors.filter((m) => !m.isActive)

  const columns: Column<Mentor>[] = [
    {
      key: "name",
      header: "Mentor",
      sortable: true,
      className: "w-[200px]",
      render: (mentor) => (
        <div className="flex items-center gap-3">
          <img
            src={mentor.user.image}
            alt={mentor.user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-sm">{mentor.user.name}</p>
            <p className="text-xs text-muted-foreground">{mentor.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "skills",
      header: "Skills",
      className: "hidden md:table-cell w-[180px]",
      render: (mentor) => (
        <div className="flex flex-wrap gap-1">
          {mentor.mentorSkill?.slice(0, 3).map((ms) => (
            <Badge key={ms.skill.id} variant="secondary" className="text-xs">
              {ms.skill.skill}
            </Badge>
          ))}
          {(mentor.mentorSkill?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(mentor.mentorSkill?.length || 0) - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "courses",
      header: "Courses",
      className: "hidden lg:table-cell w-[150px]",
      render: (mentor) => (
        <span className="text-sm text-muted-foreground">
          {mentor.courseTaken?.length || 0} courses
        </span>
      ),
    },
    {
      key: "schedule",
      header: "Hours/Week",
      className: "hidden lg:table-cell w-[100px]",
      render: (mentor) => (
        <span className="text-sm">
          {mentor.scheduleBlocks?.length || 0} hrs
        </span>
      ),
    },
    {
      key: "expiration",
      header: "Expires",
      sortable: true,
      className: "w-[120px]",
      render: (mentor) => {
        const expired = isExpired(mentor.expirationDate)
        const approaching = isExpirationApproaching(mentor.expirationDate)
        return (
          <span
            className={`text-sm ${
              expired
                ? "text-destructive font-medium"
                : approaching
                ? "text-orange-500 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {formatDate(mentor.expirationDate)}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-[120px]",
      render: (mentor) => (
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant={mentor.isActive ? "ghost" : "outline"}
            onClick={() => handleToggleActive(mentor)}
            title={mentor.isActive ? "Deactivate mentor" : "Activate mentor"}
          >
            {mentor.isActive ? (
              <UserX className="h-3 w-3" />
            ) : (
              <UserCheck className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => handleOpenEditModal(mentor)}
            title="Edit mentor"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="xs"
            variant="destructiveGhost"
            onClick={() => {
              setDeleteMentor(mentor)
              setDeleteModalOpen(true)
            }}
            title="Remove mentor"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Loading mentors...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-2 bg-background rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{inv.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant="destructiveGhost"
                  onClick={() => setCancelInvitation(inv)}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Mentors */}
      <DataTable
        data={activeMentors}
        columns={columns}
        keyField="id"
        title={`Active Mentors (${activeMentors.length})`}
        titleExtra={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSwipeModalOpen(true)}
            disabled={isSendingSwipe}
          >
            <Mail className="h-4 w-4 mr-2" />
            Request Swipe Access
          </Button>
        }
        searchPlaceholder="Search mentors..."
        onAdd={() => setInviteModalOpen(true)}
        addLabel="Invite Mentor"
        emptyMessage="No active mentors"
      />

      {/* Inactive Mentors */}
      {inactiveMentors.length > 0 && (
        <DataTable
          data={inactiveMentors}
          columns={columns}
          keyField="id"
          title={`Inactive Mentors (${inactiveMentors.length})`}
          searchPlaceholder="Search inactive mentors..."
          emptyMessage="No inactive mentors"
        />
      )}

      {/* Invite Mentor Modal */}
      <MentorInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={() => {
          fetchInvitations()
        }}
      />

      {/* Edit Mentor Modal */}
      <Modal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Mentor"
        description={editMentor ? `Editing ${editMentor.user.name}` : ""}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={editIsActive ? "active" : "inactive"}
              onValueChange={(v) => setEditIsActive(v === "active")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiration Date</label>
            <input
              type="date"
              value={editExpirationDate}
              onChange={(e) => setEditExpirationDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditMentor} disabled={isEditing}>
            {isEditing ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Mentor Modal */}
      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Remove Mentor"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove <strong>{deleteMentor?.user.name}</strong> as a
          mentor? This will also remove all their schedule assignments.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteMentor} disabled={isDeleting}>
            {isDeleting ? "Removing..." : "Remove Mentor"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel Invitation Modal */}
      <Modal
        open={!!cancelInvitation}
        onOpenChange={(open) => !open && setCancelInvitation(null)}
        title="Cancel Invitation"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Cancel the mentor invitation sent to <strong>{cancelInvitation?.invitedEmail}</strong>?
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setCancelInvitation(null)}>
            Keep Invitation
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelInvitation}
            disabled={isCancellingInvitation}
          >
            {isCancellingInvitation ? "Cancelling..." : "Cancel Invitation"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={swipeModalOpen}
        onOpenChange={setSwipeModalOpen}
        title="Request Swipe Access"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Send a swipe access request for all active mentors?
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setSwipeModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSwipeModalOpen(false)
              handleSendSwipeAccess()
            }}
            disabled={isSendingSwipe}
          >
            {isSendingSwipe ? "Sending..." : "Send Request"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
