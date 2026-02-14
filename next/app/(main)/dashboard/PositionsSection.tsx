"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Mail, Pencil, Trash2, FileText } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
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
  const [isSendingSwipe, setIsSendingSwipe] = useState(false)
  const [swipeModalOpen, setSwipeModalOpen] = useState(false)
  const [swipeModalLabel, setSwipeModalLabel] = useState("")
  const [swipeModalPositions, setSwipeModalPositions] = useState<Position[]>([])

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

  const handleSendSwipeAccess = async (positionsToSend: Position[], label: string) => {
    const people = positionsToSend
      .map((position) => position.currentOfficer)
      .filter((officer): officer is NonNullable<Position["currentOfficer"]> => !!officer)
      .map((officer) => ({ name: officer.name, email: officer.email }))

    if (people.length === 0) {
      toast.error("No officers to include in swipe request")
      return
    }

    setIsSendingSwipe(true)
    try {
      const response = await fetch("/api/swipe-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: label,
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

  const isMobile = useIsMobile()

  // Separate primary officers and committee heads
  const primaryOfficers = positions.filter(p => p.is_primary)
  const committeeHeads = positions.filter(p => !p.is_primary)

  const columns: Column<Position>[] = [
    {
      key: "title",
      header: "Position",
      sortable: true,
      isPrimary: true,
      className: "w-[180px]",
      render: (position) => (
        <span className="font-medium text-sm">{position.title}</span>
      )
    },
    {
      key: "officer",
      header: "Assigned Officer",
      isFullWidth: true,
      className: "w-[420px]",
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
      mobileHidden: true,
      className: "hidden lg:table-cell w-[100px]",
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
      isAction: true,
      className: "w-[80px]",
      render: (position) => (
        <div className={`flex items-center ${isMobile ? "flex-wrap gap-2" : "gap-1"}`}>
          {isMobile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/dashboard/positions/${position.id}/handover`)}
              className="gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Handover
            </Button>
          )}
          <Button
            size={isMobile ? "sm" : "xs"}
            variant={isMobile ? "outline" : "ghost"}
            onClick={() => handleEdit(position)}
            title="Edit position"
            className={isMobile ? "gap-1.5" : ""}
          >
            <Pencil className={isMobile ? "h-3.5 w-3.5" : "h-3 w-3"} />
            {isMobile && "Edit"}
          </Button>
          <Button
            size={isMobile ? "sm" : "xs"}
            variant={isMobile ? "outline" : "destructiveGhost"}
            onClick={() => setDeletePosition(position)}
            disabled={position.isFilled || !!getPendingInvitation(position.id)}
            title={position.isFilled ? "Cannot delete position with assigned officer" : 
                   getPendingInvitation(position.id) ? "Cannot delete position with pending invitation" :
                   "Delete position"}
            className={isMobile ? "gap-1.5 text-destructive hover:text-destructive" : ""}
          >
            <Trash2 className={isMobile ? "h-3.5 w-3.5" : "h-3 w-3"} />
            {isMobile && "Delete"}
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
        titleExtra={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSwipeModalPositions(primaryOfficers)
              setSwipeModalLabel("Primary Officers")
              setSwipeModalOpen(true)
            }}
            disabled={isSendingSwipe}
          >
            <Mail className="h-4 w-4 mr-2" />
            Request Swipe Access
          </Button>
        }
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
        titleExtra={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSwipeModalPositions(committeeHeads)
              setSwipeModalLabel("Committee Heads")
              setSwipeModalOpen(true)
            }}
            disabled={isSendingSwipe}
          >
            <Mail className="h-4 w-4 mr-2" />
            Request Swipe Access
          </Button>
        }
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

      <Modal
        open={swipeModalOpen}
        onOpenChange={setSwipeModalOpen}
        title="Request Swipe Access"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Send a swipe access request for the currently assigned {swipeModalLabel.toLowerCase()}?
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setSwipeModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSwipeModalOpen(false)
              handleSendSwipeAccess(swipeModalPositions, swipeModalLabel)
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
