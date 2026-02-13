"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Loader2, Upload, Trash2, AlertTriangle, Calendar, Users, Link2, Lock } from "lucide-react"

// Required email recipient that is always included
const REQUIRED_RECIPIENT = "softwareengineering@rit.edu";
import AttendanceInput, { Attendee } from "./AttendanceInput"

interface LinkedEvent {
  id: string
  title: string
  date: string
  attendanceEnabled: boolean
}

interface PurchaseRequest {
  id: number
  name: string
  committee: string
  description: string
  estimatedCost: string
  plannedDate: string
  status: string
  notifyEmail: string
  eventId?: string | null
  event?: LinkedEvent | null
}

interface ReceiptFormProps {
  request: PurchaseRequest
  onClose: () => void
  onSuccess: () => void
}

export default function ReceiptForm({ request, onClose, onSuccess }: ReceiptFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Form state
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [actualCost, setActualCost] = useState(request.estimatedCost)
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [receiptEmail, setReceiptEmail] = useState("")
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [attendanceImage, setAttendanceImage] = useState<string | null>(null)
  
  // Linked event state
  const [linkedEventAttendees, setLinkedEventAttendees] = useState<Attendee[]>([])
  const [loadingEventAttendance, setLoadingEventAttendance] = useState(false)
  
  // Check if this purchase is linked to an event with attendance
  const hasLinkedEvent = request.event && request.event.attendanceEnabled
  
  // Fetch event attendance if linked to an event
  useEffect(() => {
    if (hasLinkedEvent && request.eventId) {
      setLoadingEventAttendance(true)
      fetch(`/api/event/${request.eventId}/attendance`)
        .then((res) => res.json())
        .then((data) => {
          if (data.attendees && data.attendees.length > 0) {
            const eventAttendees: Attendee[] = data.attendees.map((a: { name: string; email: string }) => {
              const [firstName, ...lastNameParts] = (a.name || "").split(" ")
              return {
                firstName: firstName || "",
                lastName: lastNameParts.join(" ") || "",
                email: a.email || "",
              }
            })
            setLinkedEventAttendees(eventAttendees)
            setAttendees(eventAttendees) // Auto-fill the attendees
          }
          // Auto-fill event name and date from linked event
          if (request.event) {
            setEventName(request.event.title)
            const date = new Date(request.event.date)
            setEventDate(date.toISOString().split("T")[0])
          }
        })
        .catch((err) => console.error("Error fetching event attendance:", err))
        .finally(() => setLoadingEventAttendance(false))
    }
  }, [hasLinkedEvent, request.eventId, request.event])

  // Receipt image upload handler
  const handleReceiptUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setReceiptImage(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const clearReceiptImage = () => {
    setReceiptImage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate required fields
    if (!receiptImage) {
      setError("Please upload a receipt image")
      setLoading(false)
      return
    }

    if (!actualCost) {
      setError("Please enter the actual amount charged")
      setLoading(false)
      return
    }


    try {
      // Update the purchase request with receipt data
      const response = await fetch(`/api/purchasing/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          actualCost: parseFloat(actualCost),
          receiptImage,
          ...(receiptEmail ? { receiptEmail } : {}),
          eventName: eventName || null,
          eventDate: eventDate ? new Date(eventDate).toISOString() : null,
          attendanceData: attendees.length > 0 ? JSON.stringify(attendees) : null,
          attendanceImage: attendanceImage || null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      // Send receipt email
      try {
        const emailResponse = await fetch(`/api/purchasing/${request.id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "receipt" }),
        })
        if (emailResponse.ok) {
          console.log("Receipt email sent successfully")
        } else {
          console.error("Email API error:", await emailResponse.text())
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        // Don't fail the whole request if email fails
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Button variant="ghost" className="mb-4 gap-2" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Receipt</CardTitle>
            <CardDescription>
              Submit the receipt and attendance for your purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Original Request Summary */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Original Request</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Committee:</span> {request.committee}
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Cost:</span> ${parseFloat(request.estimatedCost).toFixed(2)}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Description:</span> {request.description}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Receipt Image Upload */}
              <div className="space-y-2">
                <Label>Receipt Photo *</Label>
                <p className="text-sm text-muted-foreground">
                  Upload a clear photo of your receipt showing items, payment method, and total
                </p>
                
                {receiptImage ? (
                  <div className="space-y-4">
                    <div className="relative border rounded-lg overflow-hidden">
                      <img
                        src={receiptImage}
                        alt="Receipt"
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={clearReceiptImage} className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      id="receipt-image-upload"
                    />
                    <label
                      htmlFor="receipt-image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload receipt photo
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Actual Cost */}
              <div className="space-y-2">
                <Label htmlFor="actualCost">Actual Amount Charged *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="actualCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              {/* Linked Event Info */}
              {hasLinkedEvent && request.event ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Link2 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-primary">Linked to Event</p>
                      <p className="text-sm text-muted-foreground">
                        Attendance will be pulled from the event check-in list
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {request.event.title}
                    </Badge>
                  </div>

                  {/* Event details (read-only) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Name</Label>
                      <Input value={eventName} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Date</Label>
                      <Input value={eventDate} disabled className="bg-muted" />
                    </div>
                  </div>

                  {/* Event Attendance List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Attendance from Event
                      </Label>
                      <Badge variant="outline">
                        {loadingEventAttendance ? "Loading..." : `${linkedEventAttendees.length} attendees`}
                      </Badge>
                    </div>
                    
                    {loadingEventAttendance ? (
                      <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/30">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading attendance from event...
                      </div>
                    ) : linkedEventAttendees.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr>
                                <th className="text-left py-2 px-3 font-medium">Name</th>
                                <th className="text-left py-2 px-3 font-medium">Email</th>
                              </tr>
                            </thead>
                            <tbody>
                              {linkedEventAttendees.map((attendee, index) => (
                                <tr key={index} className="border-t">
                                  <td className="py-2 px-3">
                                    {attendee.firstName} {attendee.lastName}
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {attendee.email}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30 text-center">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No attendees have checked in yet</p>
                        <p className="text-sm text-muted-foreground">
                          Share the event check-in page to collect attendance
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Event Info (manual entry) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Event Name</Label>
                      <Input
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g., Board Game Night"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Event Date</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Attendance Input (manual entry) */}
                  <AttendanceInput
                    attendees={attendees}
                    onAttendeesChange={setAttendees}
                    attendanceImage={attendanceImage}
                    onAttendanceImageChange={setAttendanceImage}
                  />
                </>
              )}

              {/* Receipt Email */}
              <div className="space-y-2">
                <Label>Send receipt to</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{REQUIRED_RECIPIENT}</span>
                  <span className="text-xs text-muted-foreground">(always included)</span>
                </div>
                <div className="mt-2">
                  <Label htmlFor="receiptEmail" className="text-sm">Additional recipient emails (optional)</Label>
                  <Input
                    id="receiptEmail"
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="treasurer@sse.rit.edu"
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The receipt and attendance will be emailed to these addresses
                </p>
              </div>

              {/* Reminder Banner */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-400">
                    Don&apos;t forget!
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    Save a copy of the receipt to the{" "}
                    <a 
                      href="https://drive.google.com/drive/u/1/folders/0AMM6DHs73ONAUk9PVA" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-300"
                    >
                      SSE Drive
                    </a>
                    {" "}→ Year → $$$ → Semester
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Receipt
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
