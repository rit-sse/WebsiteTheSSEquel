"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import PositionModal from "./PositionModal"
import OfficerAssignmentCard from "./OfficerAssignmentCard"
import OfficerInviteModal from "./OfficerInviteModal"

// Extended Position type that includes current officer details
export interface Position {
  id: number
  title: string
  is_primary: boolean
  isFilled: boolean
  currentOfficer: {
    id: number
    userId: number
    name: string
    email: string
    image?: string
    start_date: string
    end_date: string
  } | null
}

// Pending invitation type
interface PendingInvitation {
  id: number
  invitedEmail: string
  positionId: number
  createdAt: string
  expiresAt: string
  inviter: {
    id: number
    name: string
    email: string
  }
}

export default function PositionsSection() {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [newPositionIsPrimary, setNewPositionIsPrimary] = useState(false)
  const [deletePosition, setDeletePosition] = useState<Position | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [invitePosition, setInvitePosition] = useState<Position | null>(null)
  
  // Remove officer state
  const [removeOfficerPosition, setRemoveOfficerPosition] = useState<Position | null>(null)
  const [isRemovingOfficer, setIsRemovingOfficer] = useState(false)
  
  // Cancel invitation state
  const [cancelInvitation, setCancelInvitation] = useState<PendingInvitation | null>(null)
  const [isCancellingInvitation, setIsCancellingInvitation] = useState(false)

  const fetchPositions = useCallback(async () => {
    setIsLoading(true)
    try {
      const [positionsResponse, invitationsResponse] = await Promise.all([
        fetch("/api/officer-positions"),
        fetch("/api/invitations?type=officer")
      ])
      
      if (positionsResponse.ok) {
        const data = await positionsResponse.json()
        setPositions(data)
      }
      
      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json()
        setPendingInvitations(data)
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
        toast.success("Position deleted")
        fetchPositions()
        setDeletePosition(null)
      } else {
        const errorText = await response.text()
        toast.error(errorText || "Failed to delete position")
      }
    } catch (error) {
      console.error("Failed to delete position:", error)
      toast.error("An error occurred while deleting")
    } finally {
      setIsDeleting(false)
    }
  }

  // Invite handler
  const handleInviteOfficer = (position: Position) => {
    setInvitePosition(position)
    setInviteModalOpen(true)
  }

  // Get pending invitation for a position
  const getPendingInvitation = (positionId: number): PendingInvitation | null => {
    return pendingInvitations.find(inv => inv.positionId === positionId) || null
  }

  const handleRemoveOfficerConfirm = async () => {
    if (!removeOfficerPosition?.currentOfficer) return
    setIsRemovingOfficer(true)
    try {
      const response = await fetch("/api/officer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: removeOfficerPosition.currentOfficer.id
        })
      })
      if (response.ok) {
        toast.success("Officer removed")
        fetchPositions()
        setRemoveOfficerPosition(null)
      } else {
        const errorText = await response.text()
        toast.error(errorText || "Failed to remove officer")
      }
    } catch (error) {
      console.error("Failed to remove officer:", error)
      toast.error("An error occurred while removing officer")
    } finally {
      setIsRemovingOfficer(false)
    }
  }

  const handleCancelInvitationConfirm = async () => {
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
        fetchPositions()
        setCancelInvitation(null)
      } else {
        const errorText = await response.text()
        toast.error(errorText || "Failed to cancel invitation")
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
      toast.error("An error occurred while cancelling invitation")
    } finally {
      setIsCancellingInvitation(false)
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
        <span className="font-medium text-sm">{position.title}</span>
      )
    },
    {
      key: "officer",
      header: "Assigned Officer",
      className: "min-w-[280px]",
      render: (position) => {
        const pendingInv = getPendingInvitation(position.id)
        return (
          <OfficerAssignmentCard
            officer={position.currentOfficer}
            pendingInvitation={pendingInv}
            onInvite={() => handleInviteOfficer(position)}
            onRemove={() => setRemoveOfficerPosition(position)}
            onCancelInvitation={() => pendingInv && setCancelInvitation(pendingInv)}
          />
        )
      }
    },
    {
      key: "handover",
      header: "Handover",
      className: "hidden lg:table-cell",
      render: (position) => (
        <Button 
          size="xs" 
          variant="outline"
          onClick={() => router.push(`/dashboard/positions/${position.id}/handover`)}
          title="View/Edit handover document"
        >
          View
        </Button>
      )
    },
    {
      key: "actions",
      header: "",
      render: (position) => (
        <div className="flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={() => handleEdit(position)} title="Edit position">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            size="xs" 
            variant="destructiveGhost" 
            onClick={() => setDeletePosition(position)}
            disabled={position.isFilled || !!getPendingInvitation(position.id)}
            title={position.isFilled ? "Cannot delete position with assigned officer" : 
                   getPendingInvitation(position.id) ? "Cannot delete position with pending invitation" :
                   "Delete position"}
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

      {/* Create/Edit Position Modal */}
      <PositionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        position={editPosition}
        defaultIsPrimary={newPositionIsPrimary}
        onSuccess={fetchPositions}
      />

      {/* Invite Officer Modal */}
      <OfficerInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        position={invitePosition ? {
          id: invitePosition.id,
          title: invitePosition.title,
          is_primary: invitePosition.is_primary
        } : null}
        onSuccess={() => {
          fetchPositions()
          setInvitePosition(null)
        }}
      />

      {/* Delete Position Confirmation Modal */}
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

      {/* Remove Officer Confirmation Modal */}
      <Modal
        open={!!removeOfficerPosition}
        onOpenChange={(open) => !open && setRemoveOfficerPosition(null)}
        title="Remove Officer"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Remove <strong>{removeOfficerPosition?.currentOfficer?.name}</strong> from <strong>{removeOfficerPosition?.title}</strong>?
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setRemoveOfficerPosition(null)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleRemoveOfficerConfirm}
            disabled={isRemovingOfficer}
          >
            {isRemovingOfficer ? "Removing..." : "Remove"}
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
            onClick={handleCancelInvitationConfirm}
            disabled={isCancellingInvitation}
          >
            {isCancellingInvitation ? "Cancelling..." : "Cancel Invitation"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
