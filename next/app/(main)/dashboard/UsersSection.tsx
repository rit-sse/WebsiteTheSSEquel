"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Mail, Clock, X } from "lucide-react"
import UserModal, { User } from "./UserModal"
import UserInviteModal from "./UserInviteModal"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

interface PendingInvitation {
  id: number
  invitedEmail: string
  createdAt: string
  expiresAt: string
  inviter: {
    id: number
    name: string
    email: string
  }
}

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cancelInvitation, setCancelInvitation] = useState<PendingInvitation | null>(null)
  const [isCancellingInvitation, setIsCancellingInvitation] = useState(false)
  const isMobile = useIsMobile()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersResponse, invitationsResponse] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/invitations?type=user")
      ])
      
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUsers(data)
      }
      
      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json()
        setPendingInvitations(data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInvite = () => {
    setInviteModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setEditModalOpen(true)
  }

  const handleCancelInvitation = async () => {
    if (!cancelInvitation) return
    setIsCancellingInvitation(true)
    try {
      const response = await fetch("/api/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cancelInvitation.id })
      })
      if (response.ok) {
        toast.success("Invitation cancelled")
        fetchData()
        setCancelInvitation(null)
      } else {
        const errorText = await response.text()
        toast.error(errorText || "Failed to cancel invitation")
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
      toast.error("An error occurred")
    } finally {
      setIsCancellingInvitation(false)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "today"
    if (diffDays === 1) return "yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userToDelete.id })
      })

      if (response.ok) {
        toast.success("User deleted")
        await fetchData()
        setDeleteModalOpen(false)
        setUserToDelete(null)
      } else {
        const errorText = await response.text()
        toast.error(`Failed to delete user: ${errorText}`)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("An error occurred while deleting the user")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      isPrimary: true,
      render: (user) => (
        <span className="font-medium">{user.name}</span>
      )
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (user) => (
        <span className="text-muted-foreground">{user.email}</span>
      )
    },
    {
      key: "membershipCount",
      header: "Memberships",
      sortable: true,
      render: (user) => (
        <Badge variant={user.membershipCount >= 1 ? "cat-5" : "outline"} className="text-xs">
          {user.membershipCount}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "",
      isAction: true,
      render: (user) => (
        isMobile ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(user)}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteClick(user)}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => handleEdit(user)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="xs"
              variant="destructiveGhost"
              onClick={() => handleDeleteClick(user)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="grid gap-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-accentScale-5/15 border border-accentScale-5/30"
              >
                <div className="h-8 w-8 rounded-full bg-accentScale-5/25 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-accentScale-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-accentScale-5">
                    {invitation.invitedEmail}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Invited {formatTimeAgo(invitation.createdAt)} by {invitation.inviter.name}</span>
                  </div>
                </div>
                <Badge variant="cat-6">
                  Pending
                </Badge>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setCancelInvitation(invitation)}
                  title="Cancel invitation"
                  className="text-accentScale-5 hover:text-accentScale-5"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        keyField="id"
        title="Users"
        searchPlaceholder="Search users by name or email..."
        searchFields={["name", "email"]}
        onAdd={handleInvite}
        addLabel="Invite User"
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {/* Invite Modal */}
      <UserInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={fetchData}
      />

      {/* Edit Modal */}
      <UserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={editUser}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete User"
      >
        <p className="text-foreground">
          Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
          This will also remove all their associated data (officer records, quotes, etc.).
        </p>
        <p className="text-sm text-destructive mt-2">
          This action cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructiveGhost"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel Invitation Confirmation Modal */}
      <Modal
        open={!!cancelInvitation}
        onOpenChange={(open) => !open && setCancelInvitation(null)}
        title="Cancel Invitation"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Cancel the invitation sent to <strong>{cancelInvitation?.invitedEmail}</strong>?
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
    </div>
  )
}
