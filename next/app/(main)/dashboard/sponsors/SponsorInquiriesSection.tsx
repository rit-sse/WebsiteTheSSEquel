"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Check, X, Trash2, Mail, Building2 } from "lucide-react"

export interface SponsorshipInquiry {
  id: number
  companyName: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  interestedTier: string
  message?: string
  status: string
  createdAt: string
}

type FilterStatus = "pending" | "contacted" | "approved" | "declined"

const tierLabels: Record<string, string> = {
  tier1: "Tier 1 - Visibility",
  tier2: "Tier 2 - Engagement",
  tier3: "Tier 3 - Premium",
  custom: "Custom Package",
}

export default function SponsorInquiriesSection() {
  const [inquiries, setInquiries] = useState<SponsorshipInquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterStatus>("pending")
  const [error, setError] = useState("")

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/sponsorship-inquiries?status=${filter}`)
      if (!response.ok) {
        throw new Error("Failed to fetch inquiries")
      }
      const data = await response.json()
      setInquiries(data)
    } catch (err) {
      console.error("Error fetching inquiries:", err)
      setError("Failed to load sponsorship inquiries")
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const handleUpdateStatus = async (id: number, status: string) => {
    setProcessingId(id)
    try {
      const response = await fetch("/api/sponsorship-inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        await fetchInquiries()
      } else {
        const errorText = await response.text()
        setError(errorText || `Failed to update status to ${status}`)
      }
    } catch (err) {
      console.error("Error updating inquiry:", err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch("/api/sponsorship-inquiries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        await fetchInquiries()
      } else {
        const errorText = await response.text()
        setError(errorText || "Failed to delete inquiry")
      }
    } catch (err) {
      console.error("Error deleting inquiry:", err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const columns: Column<SponsorshipInquiry>[] = [
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      render: (inquiry) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-medium text-sm block truncate">{inquiry.companyName}</span>
            <span className="text-xs text-muted-foreground block sm:hidden truncate">
              {inquiry.contactName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "contactName",
      header: "Contact",
      className: "hidden sm:table-cell",
      render: (inquiry) => (
        <div className="min-w-0">
          <span className="text-sm block truncate">{inquiry.contactName}</span>
          <span className="text-xs text-muted-foreground truncate block">{inquiry.contactEmail}</span>
        </div>
      ),
    },
    {
      key: "interestedTier",
      header: "Tier",
      className: "hidden md:table-cell",
      render: (inquiry) => (
        <span className="text-xs text-muted-foreground">
          {tierLabels[inquiry.interestedTier] || inquiry.interestedTier}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      className: "hidden lg:table-cell",
      sortable: true,
      render: (inquiry) => (
        <span className="text-xs text-muted-foreground">
          {new Date(inquiry.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (inquiry) => {
        const isProcessing = processingId === inquiry.id

        if (inquiry.status === "pending") {
          return (
            <div className="flex gap-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleUpdateStatus(inquiry.id, "declined")}
                disabled={isProcessing}
                title="Decline"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => handleUpdateStatus(inquiry.id, "contacted")}
                disabled={isProcessing}
                title="Mark as Contacted"
              >
                <Mail className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="accent"
                onClick={() => handleUpdateStatus(inquiry.id, "approved")}
                disabled={isProcessing}
                title="Approve"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          )
        }

        if (inquiry.status === "contacted") {
          return (
            <div className="flex gap-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleUpdateStatus(inquiry.id, "declined")}
                disabled={isProcessing}
                title="Decline"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                size="xs"
                variant="accent"
                onClick={() => handleUpdateStatus(inquiry.id, "approved")}
                disabled={isProcessing}
                title="Approve"
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
            onClick={() => handleDelete(inquiry.id)}
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
      {(["pending", "contacted", "approved", "declined"] as FilterStatus[]).map((status) => (
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
        data={inquiries}
        columns={columns}
        keyField="id"
        title="Sponsorship Inquiries"
        titleExtra={filterTabs}
        searchPlaceholder="Search inquiries..."
        searchFields={["companyName", "contactName", "contactEmail"]}
        isLoading={isLoading}
        emptyMessage={`No ${filter} inquiries`}
      />
    </div>
  )
}
