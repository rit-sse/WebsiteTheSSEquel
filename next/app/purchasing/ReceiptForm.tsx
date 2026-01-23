"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Send, Loader2, Upload, Trash2, AlertTriangle } from "lucide-react"
import AttendanceInput, { Attendee } from "./AttendanceInput"
import GmailAuthModal from "@/components/GmailAuthModal"
import { useGmailAuth } from "@/lib/hooks/useGmailAuth"

interface PurchaseRequest {
  id: number
  name: string
  committee: string
  description: string
  estimatedCost: string
  plannedDate: string
  status: string
  notifyEmail: string
}

interface ReceiptFormProps {
  request: PurchaseRequest
  onClose: () => void
  onSuccess: () => void
}

export default function ReceiptForm({ request, onClose, onSuccess }: ReceiptFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gmailAuth = useGmailAuth()
  
  // Form state
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [actualCost, setActualCost] = useState(request.estimatedCost)
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [receiptEmail, setReceiptEmail] = useState("")
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [attendanceImage, setAttendanceImage] = useState<string | null>(null)

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

    if (!receiptEmail) {
      setError("Please enter the email to send the receipt to")
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
          receiptEmail,
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
        } else if (emailResponse.status === 403) {
          const data = await emailResponse.json()
          if (data.needsGmailAuth) {
            // Receipt was saved but email not sent - prompt for Gmail auth
            gmailAuth.setNeedsGmailAuth("/purchasing", data.message)
            // Still call onSuccess since the receipt was saved
            onSuccess()
            return
          }
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

              {/* Event Info */}
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

              {/* Attendance Input */}
              <AttendanceInput
                attendees={attendees}
                onAttendeesChange={setAttendees}
                attendanceImage={attendanceImage}
                onAttendanceImageChange={setAttendanceImage}
              />

              {/* Receipt Email */}
              <div className="space-y-2">
                <Label htmlFor="receiptEmail">Send receipt to (email) *</Label>
                <Input
                  id="receiptEmail"
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  placeholder="se@rit.edu"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The receipt and attendance will be emailed to this address
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

      <GmailAuthModal
        open={gmailAuth.needsAuth}
        onOpenChange={(open) => !open && gmailAuth.clearAuthState()}
        onAuthorize={gmailAuth.startGmailAuth}
        isLoading={gmailAuth.isLoading}
        message={gmailAuth.message}
      />
    </>
  )
}
