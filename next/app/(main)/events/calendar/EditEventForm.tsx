"use client"

import { useEffect, useState } from "react"
import { Event } from "../event"
import { compareDateStrings } from "./utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Calendar, MapPin, Image as ImageIcon, Users, Link2, Unlink, CreditCard } from "lucide-react"

interface LinkedPurchaseRequest {
  id: number
  description: string
  estimatedCost: string
  status: string
}

interface AvailablePurchaseRequest {
  id: number
  name: string
  description: string
  estimatedCost: string
  status: string
  eventId: string | null
}

interface FormProps {
  isOpen: boolean
  onClose: () => void
  setModalEvent: (state: boolean) => void
  event: Event
  setSelectedEvent: (event: Event) => void
  events: Event[]
  setEvents: (event: Event[]) => void
}

export default function EditEventForm({
  isOpen,
  onClose,
  setModalEvent,
  event,
  setSelectedEvent,
  events,
  setEvents,
}: FormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Purchase request linking state
  const [linkedPurchases, setLinkedPurchases] = useState<LinkedPurchaseRequest[]>([])
  const [availablePurchases, setAvailablePurchases] = useState<AvailablePurchaseRequest[]>([])
  const [showLinkSelect, setShowLinkSelect] = useState(false)
  const [purchaseSearch, setPurchaseSearch] = useState("")
  const [isLinkingPurchase, setIsLinkingPurchase] = useState(false)

  // Form state
  const [eventName, setEventName] = useState("")
  const [location, setLocation] = useState("")
  const [datetime, setDatetime] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [attendanceEnabled, setAttendanceEnabled] = useState(false)
  const [grantsMembership, setGrantsMembership] = useState(false)

  // Fill in the event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      // Convert UTC time to local timezone
      const date = new Date(event.date)
      const offset = date.getTimezoneOffset() * 60000
      
      setEventName(event.title ?? "")
      setLocation(event.location ?? "")
      setDatetime(new Date(date.getTime() - offset).toISOString().slice(0, 16) ?? "")
      setDescription(event.description ?? "")
      setImage(event.image ?? "")
      setAttendanceEnabled(event.attendanceEnabled ?? false)
      setGrantsMembership(event.grantsMembership ?? false)
      setModalEvent(false)
      setError(null)
      setShowLinkSelect(false)
      setPurchaseSearch("")

      // Fetch linked and available purchase requests
      if (event.id) {
        fetch(`/api/event/${event.id}/purchases`)
          .then((r) => r.ok ? r.json() : [])
          .then((data: LinkedPurchaseRequest[]) => setLinkedPurchases(Array.isArray(data) ? data : []))
          .catch(() => {})

        fetch("/api/purchasing")
          .then((r) => r.ok ? r.json() : [])
          .then((data: AvailablePurchaseRequest[]) =>
            setAvailablePurchases(data.filter((p) => !p.eventId || p.eventId === event.id))
          )
          .catch(() => {})
      }
    }
  }, [isOpen, event, setModalEvent])

  const handleLinkPurchase = async (purchaseId: number) => {
    if (!event?.id) return
    setIsLinkingPurchase(true)
    try {
      const res = await fetch(`/api/purchasing/${purchaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      })
      if (res.ok) {
        toast.success("Purchase request linked")
        const found = availablePurchases.find((p) => p.id === purchaseId)
        if (found) setLinkedPurchases((prev) => [...prev, { id: found.id, description: found.description, estimatedCost: found.estimatedCost, status: found.status }])
        setAvailablePurchases((prev) => prev.map((p) => p.id === purchaseId ? { ...p, eventId: event.id ?? null } : p))
        setShowLinkSelect(false)
      } else {
        toast.error("Failed to link purchase request")
      }
    } catch {
      toast.error("Failed to link purchase request")
    } finally {
      setIsLinkingPurchase(false)
    }
  }

  const handleUnlinkPurchase = async (purchaseId: number) => {
    setIsLinkingPurchase(true)
    try {
      const res = await fetch(`/api/purchasing/${purchaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: null }),
      })
      if (res.ok) {
        toast.success("Purchase request unlinked")
        setLinkedPurchases((prev) => prev.filter((p) => p.id !== purchaseId))
        setAvailablePurchases((prev) => prev.map((p) => p.id === purchaseId ? { ...p, eventId: null } : p))
      } else {
        toast.error("Failed to unlink purchase request")
      }
    } catch {
      toast.error("Failed to unlink purchase request")
    } finally {
      setIsLinkingPurchase(false)
    }
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!eventName || !datetime) {
      setError("Event name and date/time are required")
      setLoading(false)
      return
    }

    // Reformat googledrive image share link so that <img> can display it
    const googleImageMatch = image.match(RegExp("d/([^/]+)/view"))
    const googleImageLink = googleImageMatch
      ? `https://drive.google.com/thumbnail?id=${googleImageMatch[1]}`
      : image // Keep existing image URL if not a new Google Drive link

    try {
      // Update to Prisma
      const res = await fetch("/api/event", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event.id,
          title: eventName,
          location: location,
          description: description,
          date: new Date(datetime).toISOString(),
          image: googleImageLink,
          attendanceEnabled: attendanceEnabled,
          grantsMembership: grantsMembership,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update event")
      }

      const newEvent = await res.json()
      const gCalID = newEvent.id

      // Update to Google Calendar
      await fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gCalID,
          summary: eventName,
          location: location,
          description: description,
          start: new Date(datetime).toISOString(),
          end: new Date(new Date(datetime).getTime() + 60 * 60 * 1000).toISOString(),
        }),
      }).catch(console.warn) // Don't fail if GCal update fails

      // Find and remove the old event
      let updatedEvents = events.filter((e: Event) => e.id !== newEvent.id)
      // Add the updated event, sort chronologically and set new state
      updatedEvents.push(newEvent)
      updatedEvents.sort((event1, event2) => compareDateStrings(event1.date, event2.date))
      setEvents(updatedEvents)
      setSelectedEvent(newEvent)
      setModalEvent(true)
      onClose()
      clearForm()
    } catch (err) {
      console.error(err)
      setError("Failed to update event. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setEventName("")
    setLocation("")
    setDatetime("")
    setDescription("")
    setImage("")
    setAttendanceEnabled(false)
    setGrantsMembership(false)
    setError(null)
  }

  return (
    <form className="space-y-4" onSubmit={onSave}>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="eventName" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Event Name *
        </Label>
        <Input
          id="eventName"
          placeholder="Enter event name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <Input
          id="location"
          placeholder="Enter location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="datetime">Date & Time *</Label>
        <Input
          id="datetime"
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter event description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Event Image
        </Label>
        <Input
          id="image"
          placeholder="Google Drive share link"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Paste a Google Drive share link for the event image
        </p>
      </div>

      {/* Attendance Options */}
      <div className="space-y-3 p-4 bg-surface-2 rounded-lg border">
        <Label className="flex items-center gap-2 font-medium">
          <Users className="h-4 w-4" />
          Attendance Options
        </Label>

        <div className="flex items-center gap-3">
          <Checkbox
            id="attendanceEnabled"
            checked={attendanceEnabled}
            onCheckedChange={(checked) => {
              setAttendanceEnabled(checked === true)
              if (!checked) {
                setGrantsMembership(false)
              }
            }}
          />
          <Label htmlFor="attendanceEnabled" className="text-sm font-normal cursor-pointer">
            Enable attendance tracking
          </Label>
        </div>

        {attendanceEnabled && (
          <div className="flex items-center gap-3 ml-6">
            <Checkbox
              id="grantsMembership"
              checked={grantsMembership}
              onCheckedChange={(checked) => setGrantsMembership(checked === true)}
            />
            <Label htmlFor="grantsMembership" className="text-sm font-normal cursor-pointer">
              Grant membership to attendees
            </Label>
          </div>
        )}
      </div>

      {/* P-Card Request Linking */}
      <div className="space-y-3 p-4 bg-surface-2 rounded-lg border">
        <Label className="flex items-center gap-2 font-medium">
          <CreditCard className="h-4 w-4" />
          Linked Purchase Requests
        </Label>

        {linkedPurchases.length > 0 ? (
          <div className="space-y-1.5">
            {linkedPurchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{p.description.substring(0, 40)}{p.description.length > 40 ? "..." : ""}</span>
                  <Badge variant="outline" className="text-xs shrink-0">${parseFloat(p.estimatedCost).toFixed(2)}</Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUnlinkPurchase(p.id)}
                  disabled={isLinkingPurchase}
                  className="text-muted-foreground hover:text-destructive shrink-0 h-7 w-7 p-0"
                  title="Unlink"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No purchase requests linked</p>
        )}

        {!showLinkSelect ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowLinkSelect(true)}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            Link a purchase request
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Search purchase requests..."
              value={purchaseSearch}
              onChange={(e) => setPurchaseSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto border rounded-md space-y-0.5">
              {availablePurchases
                .filter((p) => !p.eventId || p.eventId === event?.id)
                .filter((p) => !linkedPurchases.some((l) => l.id === p.id))
                .filter((p) =>
                  p.description.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
                  p.name.toLowerCase().includes(purchaseSearch.toLowerCase())
                )
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isLinkingPurchase}
                    onClick={() => handleLinkPurchase(p.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{p.description.substring(0, 45)}</span>
                    <span className="text-xs text-muted-foreground shrink-0">${parseFloat(p.estimatedCost).toFixed(2)}</span>
                  </button>
                ))}
              {availablePurchases.filter((p) => !linkedPurchases.some((l) => l.id === p.id)).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">No unlinked purchase requests found</p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowLinkSelect(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
