"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Plus, Clock, CheckCircle, ArrowRight, ChevronDown, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import CheckoutForm from "./CheckoutForm"
import ReceiptForm from "./ReceiptForm"

interface PurchaseRequest {
  id: number
  name: string
  committee: string
  description: string
  estimatedCost: string
  actualCost: string | null
  plannedDate: string
  status: string
  notifyEmail: string
  receiptImage: string | null
  receiptEmail: string | null
  eventName: string | null
  eventDate: string | null
  attendanceData: string | null
  attendanceImage: string | null
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
  }
}

interface SemesterGroup {
  label: string
  sortKey: string
  requests: PurchaseRequest[]
}

// Get semester label from date
function getSemester(dateString: string): { label: string; sortKey: string } {
  const date = new Date(dateString)
  const month = date.getMonth() + 1 // 1-12
  const year = date.getFullYear()
  
  if (month >= 8 && month <= 12) {
    // August - December = Fall
    return { label: `Fall ${year}`, sortKey: `${year}-2` }
  } else if (month >= 1 && month <= 5) {
    // January - May = Spring
    return { label: `Spring ${year}`, sortKey: `${year}-1` }
  } else {
    // June - July = Summer
    return { label: `Summer ${year}`, sortKey: `${year}-0` }
  }
}

// Group requests by semester
function groupBySemester(requests: PurchaseRequest[]): SemesterGroup[] {
  const groups: { [key: string]: SemesterGroup } = {}
  
  for (const request of requests) {
    const { label, sortKey } = getSemester(request.createdAt)
    
    if (!groups[label]) {
      groups[label] = { label, sortKey, requests: [] }
    }
    groups[label].requests.push(request)
  }
  
  // Sort groups by sortKey descending (most recent first)
  return Object.values(groups).sort((a, b) => b.sortKey.localeCompare(a.sortKey))
}

export default function PurchasingPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/purchasing")
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case "checked_out":
        return <Badge variant="default" className="gap-1"><CreditCard className="h-3 w-3" /> Checked Out</Badge>
      case "returned":
        return <Badge className="gap-1 bg-green-600 hover:bg-green-700"><CheckCircle className="h-3 w-3" /> Returned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Show requests that don't have a receipt submitted yet (pending or checked_out)
  const needsReceipt = requests.filter(r => r.status !== "returned")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show checkout form
  if (showCheckoutForm) {
    return (
      <CheckoutForm
        userName={session?.user?.name || ""}
        onClose={() => setShowCheckoutForm(false)}
        onSuccess={() => {
          setShowCheckoutForm(false)
          fetchRequests()
        }}
      />
    )
  }

  // Show receipt form
  if (selectedRequest) {
    return (
      <ReceiptForm
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onSuccess={() => {
          setSelectedRequest(null)
          fetchRequests()
        }}
      />
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6 md:p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Purchasing Form</h1>
            <p className="text-muted-foreground text-base">
              Request PCard checkout and submit receipts for purchases
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2" onClick={() => setShowCheckoutForm(true)}>
              <CardHeader>
                <CardTitle>
                  Request PCard Checkout
                </CardTitle>
                <CardDescription>
                  Fill out a form to request the PCard for a purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </CardContent>
            </Card>

            <Card className={cn(
              "hover:shadow-lg transition-shadow border-2",
              needsReceipt.length === 0 && "opacity-60"
            )}>
              <CardHeader>
                <CardTitle>
                  Submit Receipt
                </CardTitle>
                <CardDescription>
                  {needsReceipt.length > 0 
                    ? `${needsReceipt.length} request${needsReceipt.length > 1 ? "s" : ""} awaiting receipt`
                    : "All receipts submitted"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {needsReceipt.length > 0 ? (
                  <div className="space-y-2">
                    {needsReceipt.slice(0, 3).map((request) => (
                      <Button
                        key={request.id}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <span className="truncate">{request.description.substring(0, 30)}...</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ))}
                    {needsReceipt.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{needsReceipt.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No requests yet. Create a checkout request first.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Request History */}
          <div className="space-y-4">
            <div className="px-2">
              <h2 className="text-xl font-bold">All Requests</h2>
              <p className="text-sm text-muted-foreground">All PCard checkout requests from officers, grouped by semester</p>
            </div>
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No requests yet. Click &quot;Request PCard Checkout&quot; to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {groupBySemester(requests).map((group, index) => (
                  <SemesterAccordion
                    key={group.label}
                    label={group.label}
                    requests={group.requests}
                    defaultOpen={index === 0}
                    getStatusBadge={getStatusBadge}
                    onSubmitReceipt={setSelectedRequest}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function SemesterAccordion({
  label,
  requests,
  defaultOpen,
  getStatusBadge,
  onSubmitReceipt,
}: {
  label: string
  requests: PurchaseRequest[]
  defaultOpen: boolean
  getStatusBadge: (status: string) => React.ReactNode
  onSubmitReceipt: (request: PurchaseRequest) => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const pendingCount = requests.filter(r => r.status !== "returned").length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
          <span className="font-semibold">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {pendingCount} pending
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-3 text-sm font-medium">Date</th>
                <th className="text-left py-3 px-3 text-sm font-medium">Submitted By</th>
                <th className="text-left py-3 px-3 text-sm font-medium">Description</th>
                <th className="text-left py-3 px-3 text-sm font-medium">Committee</th>
                <th className="text-left py-3 px-3 text-sm font-medium">Est. Cost</th>
                <th className="text-left py-3 px-3 text-sm font-medium">Status</th>
                <th className="text-left py-3 px-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-3 text-sm">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-sm">
                    {request.user.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium">{request.description.substring(0, 40)}</span>
                    {request.description.length > 40 && "..."}
                  </td>
                  <td className="py-3 px-3 text-sm">{request.committee}</td>
                  <td className="py-3 px-3 text-sm">
                    ${parseFloat(request.estimatedCost).toFixed(2)}
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(request.status)}</td>
                  <td className="py-3 px-3">
                    {request.status !== "returned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSubmitReceipt(request)}
                      >
                        Submit Receipt
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
