"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Send, Loader2, Calendar, Lock } from "lucide-react"

// Required email recipient that is always included
const REQUIRED_RECIPIENT = "softwareengineering@rit.edu";
import GmailAuthModal from "@/components/GmailAuthModal"
import { useGmailAuth } from "@/lib/hooks/useGmailAuth"

const COMMITTEES = [
  "Mentoring",
  "Lab Ops",
  "Tech Committee",
  "Events",
  "Talks",
  "Projects",
  "Misc/Presidential",
]

interface EventOption {
  id: string
  title: string
  date: string
  attendanceEnabled: boolean
}

interface CheckoutFormProps {
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutForm({ userName, onClose, onSuccess }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gmailAuth = useGmailAuth()
  
  // Form state
  const [name, setName] = useState(userName)
  const [committee, setCommittee] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [plannedDate, setPlannedDate] = useState("")
  const [notifyEmail, setNotifyEmail] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [events, setEvents] = useState<EventOption[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  // Fetch events with attendance enabled
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/event")
        if (response.ok) {
          const allEvents = await response.json()
          // Filter to events with attendance enabled
          const eventsWithAttendance = allEvents.filter((e: EventOption) => e.attendanceEnabled)
          // Sort by date descending
          eventsWithAttendance.sort((a: EventOption, b: EventOption) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          setEvents(eventsWithAttendance)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoadingEvents(false)
      }
    }
    fetchEvents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate required fields (notifyEmail is optional since REQUIRED_RECIPIENT is always included)
    if (!name || !committee || !description || !estimatedCost || !plannedDate) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      // Create the purchase request
      const response = await fetch("/api/purchasing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          committee,
          description,
          estimatedCost: parseFloat(estimatedCost),
          plannedDate: new Date(plannedDate).toISOString(),
          notifyEmail,
          eventId: selectedEventId || null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const newRequest = await response.json()

      // Send notification email
      try {
        const emailResponse = await fetch(`/api/purchasing/${newRequest.id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "checkout" }),
        })
        if (emailResponse.ok) {
          console.log("Email sent successfully")
        } else if (emailResponse.status === 403) {
          const data = await emailResponse.json()
          if (data.needsGmailAuth) {
            // Request was created but email not sent - prompt for Gmail auth
            gmailAuth.setNeedsGmailAuth("/purchasing", data.message)
            // Still call onSuccess since the request was created
            onSuccess()
            return
          }
        } else {
          const emailError = await emailResponse.text()
          console.error("Email API error:", emailError)
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

        <Card>
          <CardHeader>
            <CardTitle>Request PCard Checkout</CardTitle>
            <CardDescription>
              Fill out this form before making a purchase with the PCard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="committee">Committee *</Label>
                <Select value={committee} onValueChange={setCommittee} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a committee" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMITTEES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Link to Event (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="event">Link to Event (Optional)</Label>
                <Select value={selectedEventId || "none"} onValueChange={(val) => setSelectedEventId(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingEvents ? "Loading events..." : "Select an event to link"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No event linked</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{event.title}</span>
                          <span className="text-muted-foreground text-xs">
                            ({new Date(event.date).toLocaleDateString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this purchase to an event to automatically sync attendance data
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What are you purchasing and what&apos;s it for? *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you're purchasing and why..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="estimatedCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plannedDate">Planned Purchase Date *</Label>
                  <Input
                    id="plannedDate"
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Send notification to</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{REQUIRED_RECIPIENT}</span>
                  <span className="text-xs text-muted-foreground">(always included)</span>
                </div>
                <div className="mt-2">
                  <Label htmlFor="notifyEmail" className="text-sm">Additional notification emails (optional)</Label>
                  <Input
                    id="notifyEmail"
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="treasurer@sse.rit.edu"
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  These emails will receive a notification about your checkout request
                </p>
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
                      Submit Request
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
