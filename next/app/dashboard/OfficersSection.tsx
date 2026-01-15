"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, UserMinus } from "lucide-react"
import OfficerModal, { Officer } from "./OfficerModal"
import { Modal, ModalFooter } from "@/components/ui/modal"

export default function OfficersSection() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editOfficer, setEditOfficer] = useState<Officer | null>(null)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [officerToRemove, setOfficerToRemove] = useState<Officer | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const fetchOfficers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/officer")
      if (response.ok) {
        const data = await response.json()
        setOfficers(data)
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

  const filteredOfficers = showInactive 
    ? officers 
    : officers.filter(o => o.is_active)

  const handleAdd = () => {
    setEditOfficer(null)
    setModalOpen(true)
  }

  const handleEdit = (officer: Officer) => {
    setEditOfficer(officer)
    setModalOpen(true)
  }

  const handleRemoveClick = (officer: Officer) => {
    setOfficerToRemove(officer)
    setRemoveModalOpen(true)
  }

  const handleRemoveConfirm = async (permanent: boolean) => {
    if (!officerToRemove) return
    
    setIsRemoving(true)
    try {
      const response = await fetch("/api/officer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: officerToRemove.id,
          permanent 
        })
      })

      if (response.ok) {
        await fetchOfficers()
        setRemoveModalOpen(false)
        setOfficerToRemove(null)
      } else {
        const errorText = await response.text()
        alert(`Failed to remove officer: ${errorText}`)
      }
    } catch (error) {
      console.error("Error removing officer:", error)
      alert("An error occurred while removing the officer")
    } finally {
      setIsRemoving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
          <span className="font-medium text-xs sm:text-sm">{officer.position.title}</span>
          {officer.position.is_primary && (
            <Badge variant="default" className="ml-1 sm:ml-2 text-xs hidden sm:inline-flex">Primary</Badge>
          )}
          {/* Show officer name on mobile under position */}
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
        <div>
          <p className="font-medium text-sm">{officer.user.name}</p>
          <p className="text-xs text-muted-foreground">{officer.user.email}</p>
        </div>
      )
    },
    {
      key: "start_date",
      header: "Term",
      className: "hidden md:table-cell",
      render: (officer) => (
        <div className="text-xs">
          <p>{formatDate(officer.start_date)}</p>
          <p className="text-muted-foreground">to {formatDate(officer.end_date)}</p>
        </div>
      )
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (officer) => (
        <Badge variant={officer.is_active ? "default" : "outline"} className="text-xs">
          {officer.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (officer) => (
        <div className="flex gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="neutral"
            onClick={() => handleEdit(officer)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          {officer.is_active && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleRemoveClick(officer)}
              title="Remove from position"
              className="h-8 w-8 p-0"
            >
              <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      {/* Toggle for showing inactive */}
      <div className="mb-3 sm:mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="showInactive"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor="showInactive" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
          Show inactive officers ({officers.filter(o => !o.is_active).length})
        </label>
      </div>

      <DataTable
        data={filteredOfficers}
        columns={columns}
        keyField="id"
        searchPlaceholder="Search by name or position..."
        searchFields={["user.name" as keyof Officer, "position.title" as keyof Officer]}
        onAdd={handleAdd}
        addLabel="Assign Officer"
        isLoading={isLoading}
        emptyMessage={showInactive ? "No officers found" : "No active officers found"}
      />

      {/* Create/Edit Modal */}
      <OfficerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        officer={editOfficer}
        onSuccess={fetchOfficers}
      />

      {/* Remove Confirmation Modal */}
      <Modal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        title="Remove Officer"
      >
        <p className="text-foreground">
          Remove <strong>{officerToRemove?.user.name}</strong> from the <strong>{officerToRemove?.position.title}</strong> position?
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          You can either deactivate them (keeps the record for history) or permanently delete the record.
        </p>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setRemoveModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="neutral"
            onClick={() => handleRemoveConfirm(false)}
            disabled={isRemoving}
          >
            {isRemoving ? "..." : "Deactivate"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleRemoveConfirm(true)}
            disabled={isRemoving}
          >
            {isRemoving ? "..." : "Delete Permanently"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
