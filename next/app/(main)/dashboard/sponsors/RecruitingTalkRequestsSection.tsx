"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Check, X, Trash2, Calendar, Building2 } from "lucide-react"

export interface RecruitingTalkRequest {
  id: number
  companyName: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  preferredDates: string
  talkType: string
  expectedAttendees?: number
  description?: string
  status: string
  createdAt: string
}

type FilterStatus = "pending" | "scheduled" | "completed" | "declined"

const talkTypeLabels: Record<string, string> = {
  tech_talk: "Tech Talk",
  interview_session: "Interview Session",
  workshop: "Workshop",
  info_session: "Info Session",
}

export default function RecruitingTalkRequestsSection() {
  const [requests, setRequests] = useState<RecruitingTalkRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterStatus>("pending")
  const [error, setError] = useState("")

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/recruiting-talk-requests?status=${filter}`)
      if (!response.ok) {
        throw new Error("Failed to fetch requests")
      }
      const data = await response.json()
      setRequests(data)
    } catch (err) {
      console.error("Error fetching requests:", err)
      setError("Failed to load recruiting talk requests")
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleUpdateStatus = async (id: number, status: string) => {
    setProcessingId(id)
    try {
      const response = await fetch("/api/recruiting-talk-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        await fetchRequests()
      } else {
        const errorText = await response.text()
        setError(errorText || `Failed to update status to ${status}`)
      }
    } catch (err) {
      console.error("Error updating request:", err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch("/api/recruiting-talk-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        await fetchRequests()
      } else {
        const errorText = await response.text()
        setError(errorText || "Failed to delete request")
      }
    } catch (err) {
      console.error("Error deleting request:", err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const columns: Column<RecruitingTalkRequest>[] = [
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      render: (request) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-medium text-sm block truncate">{request.companyName}</span>
            <span className="text-xs text-muted-foreground block sm:hidden truncate">
              {request.contactName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "contactName",
      header: "Contact",
      className: "hidden sm:table-cell",
      render: (request) => (
        <div className="min-w-0">
          <span className="text-sm block truncate">{request.contactName}</span>
          <span className="text-xs text-muted-foreground truncate block">{request.contactEmail}</span>
        </div>
      ),
    },
    {
      key: "talkType",
      header: "Type",
      className: "hidden md:table-cell",
      render: (request) => (
        <span className="text-xs text-muted-foreground">
          {talkTypeLabels[request.talkType] || request.talkType}
        </span>
      ),
    },
    {
      key: "preferredDates",
      header: "Dates",
      className: "hidden lg:table-cell",
      render: (request) => (
        <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
          {request.preferredDates}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      className: "hidden xl:table-cell",
      sortable: true,
      render: (request) => (
        <span className="text-xs text-muted-foreground">
          {new Date(request.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (request) => {
        const isProcessing = processingId === request.id

        if (request.status === "pending") {
          return (
            <div className="flex gap-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleUpdateStatus(request.id, "declined")}
                disabled={isProcessing}
                title="Decline"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="accent"
                onClick={() => handleUpdateStatus(request.id, "scheduled")}
                disabled={isProcessing}
                title="Mark as Scheduled"
              >
                <Calendar className="h-3 w-3" />
              </Button>
            </div>
          )
        }

        if (request.status === "scheduled") {
          return (
            <div className="flex gap-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleUpdateStatus(request.id, "declined")}
                disabled={isProcessing}
                title="Cancel"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="accent"
                onClick={() => handleUpdateStatus(request.id, "completed")}
                disabled={isProcessing}
                title="Mark as Completed"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          )
        }

        return (
          <Button
            size="xs"
            variant="destructiveGhost"
            onClick={() => handleDelete(request.id)}
            disabled={isProcessing}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )
      },
    },
  ]

  const filterTabs = (
    <div className="flex gap-1">
      {(["pending", "scheduled", "completed", "declined"] as FilterStatus[]).map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize font-medium ${
            filter === status
              ? "bg-accent text-accent-foreground"
              : "bg-surface-3 text-muted-foreground hover:text-foreground"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      {error && (
        <div className="mb-3 p-2 bg-destructive/10 text-destructive rounded-lg text-xs">
          {error}
        </div>
      )}

      <DataTable
        data={requests}
        columns={columns}
        keyField="id"
        title="Recruiting Talk Requests"
        titleExtra={filterTabs}
        searchPlaceholder="Search requests..."
        searchFields={["companyName", "contactName", "contactEmail", "preferredDates"]}
        isLoading={isLoading}
        emptyMessage={`No ${filter} requests`}
      />
    </div>
  )
}
