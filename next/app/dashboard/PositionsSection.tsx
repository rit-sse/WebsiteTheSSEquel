"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
import PositionModal, { Position } from "./PositionModal"
import { Modal, ModalFooter } from "@/components/ui/modal"

export default function PositionsSection() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const fetchPositions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/officer-positions")
      if (response.ok) {
        const data = await response.json()
        setPositions(data)
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  const handleAdd = () => {
    setEditPosition(null)
    setModalOpen(true)
  }

  const handleEdit = (position: Position) => {
    setEditPosition(position)
    setModalOpen(true)
  }

  const handleDeleteClick = (position: Position) => {
    setPositionToDelete(position)
    setDeleteError("")
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!positionToDelete) return
    
    setIsDeleting(true)
    setDeleteError("")
    try {
      const response = await fetch("/api/officer-positions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: positionToDelete.id })
      })

      if (response.ok) {
        await fetchPositions()
        setDeleteModalOpen(false)
        setPositionToDelete(null)
      } else {
        const errorText = await response.text()
        setDeleteError(errorText || "Failed to delete position")
      }
    } catch (error) {
      console.error("Error deleting position:", error)
      setDeleteError("An error occurred while deleting the position")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<Position>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (position) => (
        <div>
          <span className="font-medium">{position.title}</span>
          <div className="sm:hidden flex items-center gap-1 mt-1">
            <Badge variant={position.is_primary ? "default" : "outline"} className="text-xs">
              {position.is_primary ? "Primary" : "Committee"}
            </Badge>
            {position.isFilled ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <XCircle className="h-3 w-3 text-yellow-600" />
            )}
          </div>
        </div>
      )
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      className: "hidden md:table-cell",
      render: (position) => (
        <span className="text-muted-foreground text-xs">{position.email}</span>
      )
    },
    {
      key: "is_primary",
      header: "Type",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (position) => (
        <Badge variant={position.is_primary ? "default" : "outline"} className="text-xs">
          {position.is_primary ? "Primary" : "Committee"}
        </Badge>
      )
    },
    {
      key: "isFilled",
      header: "Status",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (position) => (
        <div className="flex items-center gap-1">
          {position.isFilled ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 text-xs">Filled</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-600 text-xs">Open</span>
            </>
          )}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (position) => (
        <div className="flex gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="neutral"
            onClick={() => handleEdit(position)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteClick(position)}
            disabled={position.isFilled}
            title={position.isFilled ? "Remove officer first" : "Delete position"}
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
        data={positions}
        columns={columns}
        keyField="id"
        searchPlaceholder="Search positions..."
        searchFields={["title", "email"]}
        onAdd={handleAdd}
        addLabel="Add Position"
        isLoading={isLoading}
        emptyMessage="No positions found"
      />

      {/* Create/Edit Modal */}
      <PositionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        position={editPosition}
        onSuccess={fetchPositions}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Position"
      >
        <p className="text-foreground">
          Are you sure you want to delete the <strong>{positionToDelete?.title}</strong> position?
        </p>
        {positionToDelete?.isFilled && (
          <p className="text-sm text-destructive mt-2">
            This position has an active officer. Remove them first before deleting.
          </p>
        )}
        {deleteError && (
          <p className="text-sm text-destructive mt-2">{deleteError}</p>
        )}
        <ModalFooter>
          <Button variant="neutral" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isDeleting || positionToDelete?.isFilled}
          >
            {isDeleting ? "Deleting..." : "Delete Position"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
