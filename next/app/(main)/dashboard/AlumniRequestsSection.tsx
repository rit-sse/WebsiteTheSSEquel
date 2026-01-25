"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Check, X, Trash2 } from "lucide-react"
import Avatar from 'boring-avatars'
import Image from "next/image"

export interface AlumniRequest {
  id: number
  name: string
  email: string
  linkedIn?: string
  gitHub?: string
  description?: string
  image: string
  start_date: string
  end_date: string
  quote: string
  previous_roles: string
  status: string
  created_at: string
}

type FilterStatus = 'pending' | 'approved' | 'rejected'

export default function AlumniRequestsSection() {
  const [requests, setRequests] = useState<AlumniRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [error, setError] = useState("")

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/alumni-requests?status=${filter}`)
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      const data = await response.json()
      setRequests(data)
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError("Failed to load alumni requests")
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch('/api/alumni-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' })
      })

      if (response.ok) {
        await fetchRequests()
      } else {
        const errorText = await response.text()
        setError(errorText || "Failed to approve request")
      }
    } catch (err) {
      console.error('Error approving request:', err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch('/api/alumni-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' })
      })

      if (response.ok) {
        await fetchRequests()
      } else {
        const errorText = await response.text()
        setError(errorText || "Failed to reject request")
      }
    } catch (err) {
      console.error('Error rejecting request:', err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch('/api/alumni-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await fetchRequests()
      } else {
        const errorText = await response.text()
        setError(errorText || "Failed to delete request")
      }
    } catch (err) {
      console.error('Error deleting request:', err)
      setError("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const columns: Column<AlumniRequest>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (request) => (
        <div className="flex items-center gap-2">
          {request.image && request.image !== "https://source.boringavatars.com/beam/" ? (
            <Image 
              src={request.image} 
              alt={`Photo of ${request.name}`} 
              width={32} 
              height={32} 
              className="rounded-full object-cover w-8 h-8 flex-shrink-0"
              unoptimized
            /> 
          ) : (
            <Avatar size={32} name={request.name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam"/>
          )}
          <div className="min-w-0">
            <span className="font-medium text-sm block truncate">{request.name}</span>
            <span className="text-xs text-muted-foreground block sm:hidden truncate">{request.email}</span>
          </div>
        </div>
      )
    },
    {
      key: "email",
      header: "Email",
      className: "hidden sm:table-cell",
      render: (request) => (
        <span className="text-muted-foreground text-xs truncate">{request.email}</span>
      )
    },
    {
      key: "previous_roles",
      header: "Previous Roles",
      className: "hidden md:table-cell",
      render: (request) => (
        <span className="text-muted-foreground text-xs truncate max-w-[150px] block">{request.previous_roles || "-"}</span>
      )
    },
    {
      key: "dates",
      header: "Dates",
      className: "hidden lg:table-cell",
      render: (request) => (
        <span className="text-muted-foreground text-xs">{request.start_date} - {request.end_date}</span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (request) => {
        const isProcessing = processingId === request.id
        
        if (request.status === 'pending') {
          return (
            <div className="flex gap-1">
              <Button 
                size="xs" 
                variant="ghost"
                onClick={() => handleReject(request.id)}
                disabled={isProcessing}
                title="Reject"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button 
                size="xs"
                variant="accent"
                onClick={() => handleApprove(request.id)}
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
            onClick={() => handleDelete(request.id)}
            disabled={isProcessing}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )
      }
    }
  ]

  // Filter tabs - rendered above the DataTable title
  const filterTabs = (
    <div className="flex gap-1">
      {(['pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize font-medium ${
            filter === status 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-surface-3 text-muted-foreground hover:text-foreground'
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
        title="Alumni Requests"
        titleExtra={filterTabs}
        searchPlaceholder="Search requests..."
        searchFields={["name", "email", "previous_roles"]}
        isLoading={isLoading}
        emptyMessage={`No ${filter} requests`}
      />
    </div>
  )
}
