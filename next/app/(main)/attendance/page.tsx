"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Download,
  Calendar,
  MapPin,
  ExternalLink,
  QrCode,
  Award,
  Loader2,
  Link as LinkIcon,
  Plus,
  ChevronDown,
  Repeat,
} from "lucide-react"
import AddEventForm from "@/app/(main)/events/calendar/AddEventForm"
import { Event } from "@/app/(main)/events/event"
import { groupBySemester } from "@/lib/semester"

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

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch all events
      const response = await fetch("/api/event")
      if (!response.ok) throw new Error("Failed to fetch events")
      
      const fetchedEvents = await response.json()
      setAllEvents(fetchedEvents)
      
      // Filter to events with attendance enabled and fetch attendance counts
      const eventsWithAttendance: EventWithAttendance[] = []
      
      for (const event of fetchedEvents) {
        if (event.attendanceEnabled) {
          // Fetch attendance data for each event
          const attendanceResponse = await fetch(`/api/event/${event.id}/attendance`)
          const attendanceData = attendanceResponse.ok ? await attendanceResponse.json() : { count: 0 }
          
          // Fetch linked purchase requests
          const purchaseResponse = await fetch(`/api/event/${event.id}/purchases`)
          const purchaseData = purchaseResponse.ok ? await purchaseResponse.json() : []
          
          eventsWithAttendance.push({
            ...event,
            attendeeCount: attendanceData.count || 0,
            linkedPurchaseRequests: purchaseData,
          })
        }
      }
      
      // Sort by date descending (most recent first)
      eventsWithAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setEvents(eventsWithAttendance)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handler for when events are updated (from AddEventForm)
  const handleEventsUpdate = (updatedEvents: Event[]) => {
    setAllEvents(updatedEvents)
    // Refetch to get attendance counts
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

  const downloadFlyer = (eventId: string) => {
    window.open(`/api/event/${eventId}/flyer`, "_blank")
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
                View and manage event attendance, download QR flyers, and link to purchase requests
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
            <div className="space-y-4">
              {groupBySemester(events, (e) => e.date).map((group, index) => (
                <SemesterAccordion
                  key={group.label}
                  label={group.label}
                  events={group.items}
                  defaultOpen={index === 0}
                  formatDate={formatDate}
                  onViewAttendees={viewAttendees}
                  onDownloadFlyer={downloadFlyer}
                  onOpenAttendancePage={openAttendancePage}
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
        title={selectedEvent ? `Attendees - ${selectedEvent.title}` : "Attendees"}
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
                  <div key={attendee.id} className="flex items-center justify-between p-3">
                    <div>
                      <span className="text-sm text-muted-foreground mr-2">{index + 1}.</span>
                      <span className="font-medium">{attendee.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {attendee.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        
        <ModalFooter>
          <Button variant="outline" onClick={closeModal}>
            Close
          </Button>
          {selectedEvent && (
            <Button
              variant="outline"
              onClick={() => downloadFlyer(selectedEvent.id)}
              className="gap-1"
            >
              <QrCode className="h-4 w-4" />
              Download QR Flyer
            </Button>
          )}
        </ModalFooter>
      </Modal>

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
    </div>
  )
}

// Group events into recurring series and single events
interface EventGroup {
  type: "recurring" | "single"
  title: string
  events: EventWithAttendance[]
  totalAttendees: number
}

function groupEventsForDisplay(events: EventWithAttendance[]): EventGroup[] {
  // Group by title to find recurring series
  const byTitle = new Map<string, EventWithAttendance[]>()
  for (const event of events) {
    const existing = byTitle.get(event.title) || []
    existing.push(event)
    byTitle.set(event.title, existing)
  }

  const groups: EventGroup[] = []
  const processedTitles = new Set<string>()

  // Sort events by date to maintain order
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const event of sortedEvents) {
    if (processedTitles.has(event.title)) continue
    processedTitles.add(event.title)

    const seriesEvents = byTitle.get(event.title) || []
    // Sort series events by date (earliest first)
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

// Semester accordion component for grouping events
function SemesterAccordion({
  label,
  events,
  defaultOpen,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
}: {
  label: string
  events: EventWithAttendance[]
  defaultOpen: boolean
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Group events
  const eventGroups = groupEventsForDisplay(events)

  // Count totals
  const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0)
  const recurringSeriesCount = eventGroups.filter((g) => g.type === "recurring").length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
          <span className="font-semibold">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            {totalAttendees} total attendees
          </Badge>
          {recurringSeriesCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <Repeat className="h-3 w-3" />
              {recurringSeriesCount} series
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2 pl-2">
        {eventGroups.map((group) =>
          group.type === "recurring" ? (
            <RecurringSeriesAccordion
              key={group.title}
              title={group.title}
              events={group.events}
              totalAttendees={group.totalAttendees}
              formatDate={formatDate}
              onViewAttendees={onViewAttendees}
              onDownloadFlyer={onDownloadFlyer}
              onOpenAttendancePage={onOpenAttendancePage}
            />
          ) : (
            <EventCard
              key={group.events[0].id}
              event={group.events[0]}
              formatDate={formatDate}
              onViewAttendees={onViewAttendees}
              onDownloadFlyer={onDownloadFlyer}
              onOpenAttendancePage={onOpenAttendancePage}
              showTitle
            />
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Recurring series accordion
function RecurringSeriesAccordion({
  title,
  events,
  totalAttendees,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
}: {
  title: string
  events: EventWithAttendance[]
  totalAttendees: number
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{title}</span>
          <Badge variant="secondary" className="text-xs">
            {events.length} occurrences
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            {totalAttendees} attendees
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2 pl-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            formatDate={formatDate}
            onViewAttendees={onViewAttendees}
            onDownloadFlyer={onDownloadFlyer}
            onOpenAttendancePage={onOpenAttendancePage}
            showTitle={false}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Single event card
function EventCard({
  event,
  formatDate,
  onViewAttendees,
  onDownloadFlyer,
  onOpenAttendancePage,
  showTitle,
}: {
  event: EventWithAttendance
  formatDate: (date: string) => string
  onViewAttendees: (event: EventWithAttendance) => void
  onDownloadFlyer: (eventId: string) => void
  onOpenAttendancePage: (eventId: string) => void
  showTitle: boolean
}) {
  return (
    <Card depth={2} className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showTitle ? (
              <h3 className="text-lg font-semibold truncate">{event.title}</h3>
            ) : (
              <span className="font-medium">{formatDate(event.date)}</span>
            )}
            {event.grantsMembership && (
              <Badge variant="default" className="gap-1 shrink-0">
                <Award className="h-3 w-3" />
                Grants Membership
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {showTitle && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {event.attendeeCount} attendee{event.attendeeCount !== 1 ? "s" : ""}
            </span>
            {event.linkedPurchaseRequests.length > 0 && (
              <span className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                {event.linkedPurchaseRequests.length} purchase request
                {event.linkedPurchaseRequests.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewAttendees(event)}
            className="gap-1"
          >
            <Users className="h-4 w-4" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadFlyer(event.id)}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Flyer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenAttendancePage(event.id)}
            className="gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Check-in
          </Button>
        </div>
      </div>
    </Card>
  )
}
