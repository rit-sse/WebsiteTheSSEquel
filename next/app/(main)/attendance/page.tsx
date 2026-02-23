"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalFooter } from "@/components/ui/modal"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Users,
  Calendar,
  MapPin,
  ExternalLink,
  QrCode,
  Award,
  Loader2,
  Link as LinkIcon,
  Plus,
  ChevronRight,
  Repeat,
  Trash2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import AddEventForm from "@/app/(main)/events/calendar/AddEventForm"
import { Event } from "@/app/(main)/events/event"
import { groupBySemester } from "@/lib/semester"
import EmailComposerModal from "@/app/(main)/components/EmailComposerModal"

interface Attendee {
  id: number
  userId: number
  name: string
  email: string
  attendedAt: string
}

interface EventWithAttendance {
  id: string
  title: string
  date: string
  location: string | null
  attendanceEnabled: boolean
  grantsMembership: boolean
  attendeeCount: number
  linkedPurchaseRequests: {
    id: number
    description: string
    status: string
  }[]
}

interface AttendanceData {
  eventId: string
  eventTitle: string
  attendees: Attendee[]
  count: number
}

export default function AttendancePage() {
  const [events, setEvents] = useState<EventWithAttendance[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventWithAttendance | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [deletingAttendeeId, setDeletingAttendeeId] = useState<number | null>(null)
  const [deleteEventModal, setDeleteEventModal] = useState<EventWithAttendance | null>(null)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/event")
      if (!response.ok) throw new Error("Failed to fetch events")

      const fetchedEvents = await response.json()
      setAllEvents(fetchedEvents)

      const eventsWithAttendance: EventWithAttendance[] = []

      for (const event of fetchedEvents) {
        if (event.attendanceEnabled) {
          const attendanceResponse = await fetch(`/api/event/${event.id}/attendance`)
          const attendanceData = attendanceResponse.ok ? await attendanceResponse.json() : { count: 0 }

          const purchaseResponse = await fetch(`/api/event/${event.id}/purchases`)
          const purchaseData = purchaseResponse.ok ? await purchaseResponse.json() : []

          eventsWithAttendance.push({
            ...event,
            attendeeCount: attendanceData.count || 0,
            linkedPurchaseRequests: purchaseData,
          })
        }
      }

      eventsWithAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setEvents(eventsWithAttendance)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleEventsUpdate = (updatedEvents: Event[]) => {
    setAllEvents(updatedEvents)
    fetchEvents()
  }

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const viewAttendees = async (event: EventWithAttendance) => {
    setSelectedEvent(event)
    setLoadingAttendance(true)

    try {
      const response = await fetch(`/api/event/${event.id}/attendance`)
      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data)
      }
    } catch (error) {
      console.error("Error fetching attendees:", error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setAttendanceData(null)
  }

  const deleteAttendee = async (eventId: string, userId: number) => {
    setDeletingAttendeeId(userId)
    try {
      const response = await fetch(`/api/event/${eventId}/attendance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (response.ok && attendanceData) {
        setAttendanceData({
          ...attendanceData,
          attendees: attendanceData.attendees.filter(a => a.userId !== userId),
          count: attendanceData.count - 1,
        })
        setEvents(events.map(e =>
          e.id === eventId
            ? { ...e, attendeeCount: e.attendeeCount - 1 }
            : e
        ))
      }
    } catch (error) {
      console.error("Error deleting attendee:", error)
    } finally {
      setDeletingAttendeeId(null)
    }
  }

  const deleteEvent = async () => {
    if (!deleteEventModal) return
    setDeletingEvent(true)
    try {
      const response = await fetch("/api/event", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteEventModal.id }),
      })

      if (response.ok) {
        await fetch("/api/calendar", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: deleteEventModal.id }),
        }).catch(console.warn)

        setEvents(events.filter(e => e.id !== deleteEventModal.id))
        setAllEvents(allEvents.filter(e => e.id !== deleteEventModal.id))
        setDeleteEventModal(null)
      }
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setDeletingEvent(false)
    }
  }

  const openFlyerPage = (eventId: string) => {
    window.open(`/events/${eventId}/flyer`, "_blank")
  }

  const openAttendancePage = (eventId: string) => {
    window.open(`/events/${eventId}/attend`, "_blank")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6 md:p-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Attendance Lists</h1>
              <p className="text-muted-foreground text-base">
                View and manage event attendance, sign-in codes, and linked purchase requests
              </p>
            </div>
            <Button onClick={() => setShowAddEventModal(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events with attendance tracking</h3>
              <p className="text-muted-foreground">
                Create an event with attendance enabled on the{" "}
                <a href="/events/calendar" className="text-primary underline">
                  calendar page
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupBySemester(events, (e) => e.date).map((group, index) => (
                <SemesterSection
                  key={group.label}
                  label={group.label}
                  events={group.items}
                  defaultOpen={index === 0}
                  formatDate={formatDate}
                  onViewAttendees={viewAttendees}
                  onDownloadFlyer={openFlyerPage}
                  onOpenAttendancePage={openAttendancePage}
                  onDeleteEvent={setDeleteEventModal}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Attendees Modal */}
      <Modal
        open={!!selectedEvent}
        onOpenChange={(open) => !open && closeModal()}
        title={selectedEvent ? `Attendees — ${selectedEvent.title}` : "Attendees"}
        className="max-w-2xl"
      >
        {loadingAttendance ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : attendanceData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {attendanceData.count} total attendee{attendanceData.count !== 1 ? "s" : ""}
              </p>
              {selectedEvent?.grantsMembership && (
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  Memberships Granted
                </Badge>
              )}
            </div>

            {attendanceData.attendees.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No attendees yet
              </p>
            ) : (
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {attendanceData.attendees.map((attendee, index) => (
                  <div key={attendee.id} className="flex items-center justify-between p-3 group">
                    <div>
                      <span className="text-sm text-muted-foreground mr-2">{index + 1}.</span>
                      <span className="font-medium">{attendee.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {attendee.email}
                      </span>
                      {selectedEvent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAttendee(selectedEvent.id, attendee.userId)}
                          disabled={deletingAttendeeId === attendee.userId}
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                        >
                          {deletingAttendeeId === attendee.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <ModalFooter>
          {attendanceData && attendanceData.attendees.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setEmailModalOpen(true)}
              className="gap-1"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          )}
          {selectedEvent && (
            <Button
              variant="outline"
              onClick={() => openFlyerPage(selectedEvent.id)}
              className="gap-1"
            >
              <QrCode className="h-4 w-4" />
              Sign-in Code
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Email Composer Modal */}
      {attendanceData && (
        <EmailComposerModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          recipients={attendanceData.attendees.map((a) => ({ email: a.email, name: a.name }))}
          defaultSubject={selectedEvent ? `Re: ${selectedEvent.title}` : ""}
          title={`Email Attendees — ${selectedEvent?.title ?? ""}`}
        />
      )}

      {/* Add Event Modal */}
      <Modal
        open={showAddEventModal}
        onOpenChange={setShowAddEventModal}
        title="Create New Event"
        description="Create an event with attendance tracking enabled"
        className="!max-w-4xl"
      >
        <AddEventForm
          isOpen={showAddEventModal}
          onClose={() => setShowAddEventModal(false)}
          events={allEvents}
          setEvents={handleEventsUpdate}
        />
      </Modal>

      {/* Delete Event Confirmation Modal */}
      <Modal
        open={!!deleteEventModal}
        onOpenChange={(open) => !open && setDeleteEventModal(null)}
        title="Delete Event"
        description={deleteEventModal ? `Are you sure you want to delete "${deleteEventModal.title}"?` : ''}
      >
        <p className="text-sm text-muted-foreground">
          This will also delete all attendance records for this event. This action cannot be undone.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteEventModal(null)}
            disabled={deletingEvent}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={deleteEvent}
            disabled={deletingEvent}
          >
            {deletingEvent ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Event
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

/* ─── Grouping logic ─── */

interface EventGroup {
  type: "recurring" | "single"
  title: string
  events: EventWithAttendance[]
  totalAttendees: number
}

function groupEventsForDisplay(events: EventWithAttendance[]): EventGroup[] {
  const byTitle = new Map<string, EventWithAttendance[]>()
  for (const event of events) {
    const existing = byTitle.get(event.title) || []
    existing.push(event)
    byTitle.set(event.title, existing)
  }

  const groups: EventGroup[] = []
  const processedTitles = new Set<string>()

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const event of sortedEvents) {
    if (processedTitles.has(event.title)) continue
    processedTitles.add(event.title)

    const seriesEvents = byTitle.get(event.title) || []
    seriesEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (seriesEvents.length > 1) {
      groups.push({
        type: "recurring",
        title: event.title,
        events: seriesEvents,
        totalAttendees: seriesEvents.reduce((sum, e) => sum + e.attendeeCount, 0),
      })
    } else {
      groups.push({
        type: "single",
        title: event.title,
        events: seriesEvents,
        totalAttendees: event.attendeeCount,
      })
    }
  }

  return groups
}

/* ─── Semester section ─── */

function SemesterSection({
  label,
  events,
  defaultOpen,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
  onDeleteEvent,
}: {
  label: string
  events: EventWithAttendance[]
  defaultOpen: boolean
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
  onDeleteEvent: (event: EventWithAttendance) => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const eventGroups = groupEventsForDisplay(events)
  const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0)
  const recurringSeriesCount = eventGroups.filter((g) => g.type === "recurring").length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex flex-wrap items-center gap-x-3 gap-y-1 w-full p-4 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10">
        <ChevronRight
          className={`h-5 w-5 shrink-0 text-primary transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
        <h2 className="font-bold text-lg">{label}</h2>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Badge variant="secondary" className="text-xs font-medium">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            {totalAttendees}
          </Badge>
          {recurringSeriesCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <Repeat className="h-3 w-3" />
              {recurringSeriesCount} series
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 pl-1 sm:pl-4 space-y-3">
        {eventGroups.map((group) =>
          group.type === "recurring" ? (
            <RecurringSeries
              key={group.title}
              title={group.title}
              events={group.events}
              totalAttendees={group.totalAttendees}
              formatDate={formatDate}
              onViewAttendees={onViewAttendees}
              onDownloadFlyer={onDownloadFlyer}
              onOpenAttendancePage={onOpenAttendancePage}
              onDeleteEvent={onDeleteEvent}
            />
          ) : (
            <SingleEventRow
              key={group.events[0].id}
              event={group.events[0]}
              formatDate={formatDate}
              onViewAttendees={onViewAttendees}
              onDownloadFlyer={onDownloadFlyer}
              onOpenAttendancePage={onOpenAttendancePage}
              onDeleteEvent={onDeleteEvent}
            />
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ─── Recurring series ─── */

function RecurringSeries({
  title,
  events,
  totalAttendees,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
  onDeleteEvent,
}: {
  title: string
  events: EventWithAttendance[]
  totalAttendees: number
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
  onDeleteEvent: (event: EventWithAttendance) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const anyGrantsMembership = events.some((e) => e.grantsMembership)

  return (
    <Card depth={2} className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex flex-wrap items-center gap-x-3 gap-y-1 w-full px-4 py-3 hover:bg-muted/50">
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
          <Repeat className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-base">{title}</span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {anyGrantsMembership && (
              <Badge variant="default" className="gap-1 text-xs">
                <Award className="h-3 w-3" />
                Membership
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {events.length} dates
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {totalAttendees}
            </Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t divide-y">
            {events.map((event) => (
              <OccurrenceRow
                key={event.id}
                event={event}
                formatDate={formatDate}
                onViewAttendees={onViewAttendees}
                onDownloadFlyer={onDownloadFlyer}
                onOpenAttendancePage={onOpenAttendancePage}
                onDeleteEvent={onDeleteEvent}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

/* ─── Occurrence row (inside a recurring series) ─── */

function OccurrenceRow({
  event,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
  onDeleteEvent,
}: {
  event: EventWithAttendance
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
  onDeleteEvent: (event: EventWithAttendance) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
        <span className="text-sm font-semibold">{event.title}</span>
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">{formatDate(event.date)}</span>
        {event.location && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Users className="h-3 w-3" />
          {event.attendeeCount}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onViewAttendees(event)} className="h-8 w-8 p-0">
          <Users className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDownloadFlyer(event.id)} className="h-8 w-8 p-0">
          <QrCode className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onOpenAttendancePage(event.id)} className="h-8 w-8 p-0">
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteEvent(event)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ─── Single (non-recurring) event ─── */

function SingleEventRow({
  event,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
  onDeleteEvent,
}: {
  event: EventWithAttendance
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
  onDeleteEvent: (event: EventWithAttendance) => void
}) {
  return (
    <Card depth={2} className="px-4 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-base truncate">{event.title}</h3>
            {event.grantsMembership && (
              <Badge variant="default" className="gap-1 text-xs">
                <Award className="h-3 w-3" />
                Membership
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(event.date)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.attendeeCount} attendee{event.attendeeCount !== 1 ? "s" : ""}
            </span>
            {event.linkedPurchaseRequests.length > 0 && (
              <span className="flex items-center gap-1">
                <LinkIcon className="h-3.5 w-3.5" />
                {event.linkedPurchaseRequests.length} purchase request
                {event.linkedPurchaseRequests.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onViewAttendees(event)} className="gap-1 h-8 text-xs">
            <Users className="h-3.5 w-3.5" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownloadFlyer(event.id)} className="gap-1 h-8 text-xs">
            <QrCode className="h-3.5 w-3.5" />
            QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenAttendancePage(event.id)} className="gap-1 h-8 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Check-in
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteEvent(event)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
