"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
import PositionModal, { Position } from "./PositionModal"

export default function PositionsSection() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [newPositionIsPrimary, setNewPositionIsPrimary] = useState(false)
  const [deletePosition, setDeletePosition] = useState<Position | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleAddPrimary = () => {
    setEditPosition(null)
    setNewPositionIsPrimary(true)
    setModalOpen(true)
  }

  const handleAddCommittee = () => {
    setEditPosition(null)
    setNewPositionIsPrimary(false)
    setModalOpen(true)
  }

  const handleEdit = (position: Position) => {
    setEditPosition(position)
    setModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletePosition) return
    setIsDeleting(true)
    try {
      const response = await fetch("/api/officer-positions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletePosition.id })
      })
      if (response.ok) {
        fetchPositions()
        setDeletePosition(null)
      } else {
        const errorText = await response.text()
        alert(errorText || "Failed to delete position")
      }
    } catch (error) {
      console.error("Failed to delete position:", error)
      alert("An error occurred while deleting")
    } finally {
      setIsDeleting(false)
    }
  }

  // Separate primary officers and committee heads
  const primaryOfficers = positions.filter(p => p.is_primary)
  const committeeHeads = positions.filter(p => !p.is_primary)

  const columns: Column<Position>[] = [
    {
      key: "title",
      header: "Position",
      sortable: true,
      render: (position) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{position.title}</span>
          {position.isFilled ? (
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-600 shrink-0" />
          )}
        </div>
      )
    },
    {
      key: "email",
      header: "Email",
      className: "hidden sm:table-cell",
      render: (position) => (
        <span className="text-muted-foreground text-xs">{position.email}</span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (position) => (
        <div className="flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={() => handleEdit(position)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            size="xs" 
            variant="destructiveGhost" 
            onClick={() => setDeletePosition(position)}
            disabled={position.isFilled}
            title={position.isFilled ? "Cannot delete position with assigned officer" : "Delete position"}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Loading positions...</div>
  }

  return (
    <div className="space-y-6">
      {/* Primary Officers */}
      <DataTable
        data={primaryOfficers}
        columns={columns}
        keyField="id"
        title={`Primary Officers (${primaryOfficers.filter(p => p.isFilled).length}/${primaryOfficers.length} filled)`}
        searchPlaceholder="Search primary officers..."
        onAdd={handleAddPrimary}
        addLabel="Add Primary Officer"
        emptyMessage="No primary officer positions defined"
      />

      {/* Committee Heads */}
      <DataTable
        data={committeeHeads}
        columns={columns}
        keyField="id"
        title={`Committee Heads (${committeeHeads.filter(p => p.isFilled).length}/${committeeHeads.length} filled)`}
        searchPlaceholder="Search committee heads..."
        onAdd={handleAddCommittee}
        addLabel="Add Committee Head"
        emptyMessage="No committee head positions defined"
      />

      {/* Create/Edit Modal */}
      <PositionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        position={editPosition}
        defaultIsPrimary={newPositionIsPrimary}
        onSuccess={fetchPositions}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletePosition}
        onOpenChange={(open) => !open && setDeletePosition(null)}
        title="Delete Position"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{deletePosition?.title}</strong>? This action cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeletePosition(null)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
