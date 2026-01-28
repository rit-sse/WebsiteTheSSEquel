"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalFooter } from "@/components/ui/modal"
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
} from "lucide-react"
import AddEventForm from "@/app/(main)/events/calendar/AddEventForm"
import { Event } from "@/app/(main)/events/event"

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
              {events.map((event) => (
                <Card key={event.id} depth={2} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                        {event.grantsMembership && (
                          <Badge variant="default" className="gap-1 shrink-0">
                            <Award className="h-3 w-3" />
                            Grants Membership
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </span>
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
                            {event.linkedPurchaseRequests.length} purchase request{event.linkedPurchaseRequests.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewAttendees(event)}
                        className="gap-1"
                      >
                        <Users className="h-4 w-4" />
                        View Attendees
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFlyer(event.id)}
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download Flyer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAttendancePage(event.id)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Check-in Page
                      </Button>
                    </div>
                  </div>
                </Card>
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
