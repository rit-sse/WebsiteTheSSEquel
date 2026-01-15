"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import UserModal, { User } from "./UserModal"
import { Modal, ModalFooter } from "@/components/ui/modal"

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAdd = () => {
    setEditUser(null)
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setModalOpen(true)
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
        await fetchUsers()
        setDeleteModalOpen(false)
        setUserToDelete(null)
      } else {
        const errorText = await response.text()
        alert(`Failed to delete user: ${errorText}`)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("An error occurred while deleting the user")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (user) => (
        <div>
          <span className="font-medium">{user.name}</span>
          <span className="block sm:hidden text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
        </div>
      )
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (user) => (
        <span className="text-muted-foreground">{user.email}</span>
      )
    },
    {
      key: "isMember",
      header: "Member",
      sortable: true,
      render: (user) => (
        <Badge variant={user.isMember ? "default" : "outline"} className="text-xs">
          {user.isMember ? "Yes" : "No"}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="neutral"
            onClick={() => handleEdit(user)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteClick(user)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <DataTable
        data={users}
        columns={columns}
        keyField="id"
        searchPlaceholder="Search users by name or email..."
        searchFields={["name", "email"]}
        onAdd={handleAdd}
        addLabel="Add User"
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {/* Create/Edit Modal */}
      <UserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={editUser}
        onSuccess={fetchUsers}
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
          <Button variant="neutral" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
