"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import OfficerModal, { Officer } from "./OfficerModal"
import { Modal, ModalFooter } from "@/components/ui/modal"

export default function OfficersSection() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editOfficer, setEditOfficer] = useState<Officer | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [officerToDelete, setOfficerToDelete] = useState<Officer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchOfficers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/officer")
      if (response.ok) {
        const data = await response.json()
        // Only show active officers
        setOfficers(data.filter((o: Officer) => o.is_active))
      }
    } catch (error) {
      console.error("Failed to fetch officers:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOfficers()
  }, [fetchOfficers])

  const handleAdd = () => {
    setEditOfficer(null)
    setModalOpen(true)
  }

  const handleEdit = (officer: Officer) => {
    setEditOfficer(officer)
    setModalOpen(true)
  }

  const handleDeleteClick = (officer: Officer) => {
    setOfficerToDelete(officer)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!officerToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch("/api/officer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: officerToDelete.id,
          permanent: true 
        })
      })

      if (response.ok) {
        await fetchOfficers()
        setDeleteModalOpen(false)
        setOfficerToDelete(null)
      } else {
        const errorText = await response.text()
        alert(`Failed to delete officer: ${errorText}`)
      }
    } catch (error) {
      console.error("Error deleting officer:", error)
      alert("An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
    } catch {
      return dateStr
    }
  }

  const columns: Column<Officer>[] = [
    {
      key: "position",
      header: "Position",
      sortable: true,
      render: (officer) => (
        <div>
          <span className="font-medium text-sm">{officer.position.title}</span>
          {officer.position.is_primary && (
            <Badge variant="default" className="ml-2 text-xs hidden sm:inline-flex">Primary</Badge>
          )}
          <p className="sm:hidden text-xs text-muted-foreground mt-0.5">{officer.user.name}</p>
        </div>
      )
    },
    {
      key: "user",
      header: "Officer",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (officer) => (
        <span className="text-sm">{officer.user.name}</span>
      )
    },
    {
      key: "start_date",
      header: "Term",
      className: "hidden md:table-cell",
      render: (officer) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(officer.start_date)} - {formatDate(officer.end_date)}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (officer) => (
        <div className="flex gap-1">
          <Button size="xs" variant="ghost" onClick={() => handleEdit(officer)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="xs" variant="destructiveGhost" onClick={() => handleDeleteClick(officer)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <DataTable
        data={officers}
        columns={columns}
        keyField="id"
        title="Officers"
        searchPlaceholder="Search officers..."
        onAdd={handleAdd}
        addLabel="Assign Officer"
        isLoading={isLoading}
        emptyMessage="No officers assigned"
      />

      <OfficerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        officer={editOfficer}
        onSuccess={fetchOfficers}
      />

      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Remove Officer"
      >
        <p className="text-foreground">
          Remove <strong>{officerToDelete?.user.name}</strong> from <strong>{officerToDelete?.position.title}</strong>?
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
            {isDeleting ? "Removing..." : "Remove"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
