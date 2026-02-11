"use client"

import { Event } from "../event"
import { useEffect, useState, useCallback } from "react"
import { formatDate } from "./utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Download,
  Users,
  ExternalLink,
  Trash2,
  Edit,
  Calendar,
  MapPin,
  Award,
  Loader2,
} from "lucide-react"

interface Attendee {
  id: number
  userId: number
  name: string
  email: string
  attendedAt: string
}

interface FormProps {
  onClose: () => void
  isOpen: boolean
  event: Event
  openEditModal: () => void
  events: Event[]
  setEvents: (event: Event[]) => void
}

export default function EventForm({
  onClose,
  isOpen,
  event,
  openEditModal,
  events,
  setEvents,
}: FormProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [showAttendees, setShowAttendees] = useState(false)
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [deletingAttendeeId, setDeletingAttendeeId] = useState<number | null>(null)

  const fetchAttendance = useCallback(async () => {
    if (!event.id || !event.attendanceEnabled) return

    setLoadingAttendees(true)
    try {
      const response = await fetch(`/api/event/${event.id}/attendance`)
      if (response.ok) {
        const data = await response.json()
        setAttendees(data.attendees || [])
        setAttendanceCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    } finally {
      setLoadingAttendees(false)
    }
  }, [event.id, event.attendanceEnabled])

  useEffect(() => {
    if (isOpen && event.attendanceEnabled) {
      fetchAttendance()
    }
  }, [isOpen, event.attendanceEnabled, fetchAttendance])

  const downloadFlyer = () => {
    if (!event.id) return
    window.open(`/api/event/${event.id}/flyer`, "_blank")
  }

  const openAttendancePage = () => {
    if (!event.id) return
    window.open(`/events/${event.id}/attend`, "_blank")
  }

  const deleteAttendee = async (userId: number) => {
    if (!event.id) return
    setDeletingAttendeeId(userId)
    try {
      const response = await fetch(`/api/event/${event.id}/attendance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        setAttendees(attendees.filter(a => a.userId !== userId))
        setAttendanceCount(attendanceCount - 1)
      }
    } catch (error) {
      console.error("Error deleting attendee:", error)
    } finally {
      setDeletingAttendeeId(null)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      // Delete from Prisma
      await fetch("/api/event", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id }),
      })

      // Delete from Google Calendar
      await fetch("/api/calendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id ?? "" }),
      }).catch(console.warn) // Don't fail if GCal delete fails

      // Find and remove the deleted event, then update state
      const updatedEvents = events.filter((e: Event) => e.id !== event.id)
      setEvents(updatedEvents)
      onClose()
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirming(false)
      setShowAttendees(false)
    }
  }, [isOpen])

  return (
    <div className="space-y-4">
      {/* Delete Confirmation */}
      {confirming && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <p className="text-sm font-medium mb-3">
            Are you sure you want to delete this event?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Event Header */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-semibold">{event.title}</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.date)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Event Image */}
        <div className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden border">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Image
              src="/icon.png"
              alt="SSE Logo"
              fill
              className="object-contain p-2"
            />
          )}
        </div>
      </div>

      {/* Attendance Section */}
      {event.attendanceEnabled && (
        <Card depth={2} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Attendance</span>
              <Badge variant="cat-1">{attendanceCount}</Badge>
            </div>
            {event.grantsMembership && (
              <Badge variant="cat-5" className="gap-1">
                <Award className="h-3 w-3" />
                Grants Membership
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadFlyer}>
              <Download className="h-4 w-4" />
              Download Flyer
            </Button>
            <Button variant="outline" size="sm" onClick={openAttendancePage}>
              <ExternalLink className="h-4 w-4" />
              Check-in Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAttendees(!showAttendees)}
            >
              <Users className="h-4 w-4" />
              {showAttendees ? "Hide" : "View"} Attendees
            </Button>
          </div>

          {showAttendees && (
            <div className="border-t pt-3 max-h-40 overflow-y-auto">
              {loadingAttendees ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading attendees...
                </div>
              ) : attendees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendees yet</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {attendees.map((attendee, index) => (
                    <li
                      key={attendee.id}
                      className="flex justify-between items-center py-1 group"
                    >
                      <span>
                        <span className="text-muted-foreground mr-2">
                          {index + 1}.
                        </span>
                        {attendee.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {attendee.email}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAttendee(attendee.userId)}
                          disabled={deletingAttendeeId === attendee.userId}
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                        >
                          {deletingAttendeeId === attendee.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="destructiveGhost"
          onClick={() => setConfirming(true)}
          disabled={confirming}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <Button variant="outline" onClick={openEditModal} className="flex-1">
          <Edit className="h-4 w-4" />
          Edit Event
        </Button>
      </div>
    </div>
  )
}
