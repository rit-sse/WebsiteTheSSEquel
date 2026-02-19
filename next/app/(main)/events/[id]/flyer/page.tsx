"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, MapPin, Loader2, AlertCircle, QrCode } from "lucide-react"

interface EventDetails {
  id: string
  title: string
  date: string
  location: string | null
  attendanceEnabled: boolean
}

export default function FlyerPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(`/api/event/${eventId}`)
      if (!response.ok) {
        setError(response.status === 404 ? "Event not found" : "Failed to load event")
        return
      }
      const data = await response.json()
      setEvent(data)
    } catch {
      setError("Failed to load event")
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const downloadFlyer = () => {
    window.open(`/api/event/${eventId}/flyer`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium">{error ?? "Event not found"}</p>
      </div>
    )
  }

  if (!event.attendanceEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <QrCode className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium">Attendance tracking is not enabled for this event</p>
      </div>
    )
  }

  const eventDate = new Date(event.date)
  const dateString = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeString = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  })

  return (
    <div className="max-w-lg mx-auto py-8 px-4 flex flex-col items-center gap-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
        <p className="text-muted-foreground text-sm">Event Sign-in Code</p>
      </div>

      <Card className="w-full" depth={2}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <CardDescription className="space-y-1">
            <span className="flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {dateString} · {timeString} EST
            </span>
            {event.location && (
              <span className="flex items-center justify-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-6">
          <p className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">
            Scan to Check In
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/event/${eventId}/qr`}
            alt="Attendance QR Code"
            className="w-64 h-64 rounded-lg border border-border"
          />
          <p className="text-xs text-muted-foreground text-center">
            Students scan this code to mark their attendance
          </p>
        </CardContent>
      </Card>

      <Button size="lg" onClick={downloadFlyer} className="gap-2 w-full max-w-xs">
        <Download className="h-5 w-5" />
        Download Printable Sign-in Flyer
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Downloads a printable SVG with the QR code and event details
      </p>
    </div>
  )
}
