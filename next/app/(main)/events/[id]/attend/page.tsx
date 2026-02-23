"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CheckCircle, Calendar, MapPin, Loader2, LogIn, AlertCircle } from "lucide-react";

interface EventDetails {
  id: string;
  title: string;
  date: string;
  location: string | null;
  image: string | null;
  description: string;
  attendanceEnabled: boolean;
  grantsMembership: boolean;
}

export default function AttendEventPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attending, setAttending] = useState(false);
  const [attended, setAttended] = useState(false);
  const [membershipGranted, setMembershipGranted] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(`/api/event/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Event not found");
        } else {
          setError("Failed to load event");
        }
        return;
      }
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleAttend = async () => {
    if (!session) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    setAttending(true);
    try {
      const response = await fetch(`/api/event/${eventId}/attendance`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setAttended(true);
        setMembershipGranted(data.membershipGranted);
      } else if (response.status === 409 && data.alreadyAttended) {
        setAttended(true);
        if (data.membershipGranted) {
          setMembershipGranted(true);
        }
      } else {
        setError(data.error || "Failed to mark attendance");
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      setError("Failed to mark attendance");
    } finally {
      setAttending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <Card className="max-w-lg mx-auto mt-12 p-6">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button variant="outline" onClick={() => router.push("/events/calendar")}>
            Go to Events Calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!event) {
    return null;
  }

  if (!event.attendanceEnabled) {
    return (
      <Card className="max-w-lg mx-auto mt-12 p-6">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Attendance tracking is not enabled for this event.</p>
          <Button variant="outline" onClick={() => router.push("/events/calendar")}>
            Go to Events Calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <Card className="overflow-hidden">
        {/* Event Image */}
        {event.image && (
          <div className="relative w-full aspect-video">
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
          <CardDescription className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Calendar className="h-4 w-4" />
              {formatDate(event.date)}
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground">{event.description}</p>
          
          {event.grantsMembership && !attended && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary font-medium">
                This event grants membership! Attending will add to your membership count.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {attended ? (
            <div className="w-full flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-xl font-medium text-green-600">You&apos;re checked in!</p>
              {membershipGranted && (
                <p className="text-sm text-primary">
                  A membership has been added to your account.
                </p>
              )}
            </div>
          ) : status === "loading" ? (
            <Button disabled className="w-full" size="lg">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </Button>
          ) : !session ? (
            <Button onClick={handleAttend} className="w-full" size="lg">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to Mark Attendance
            </Button>
          ) : (
            <Button
              onClick={handleAttend}
              disabled={attending}
              className="w-full"
              size="lg"
            >
              {attending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking in...
                </>
              ) : (
                "Mark Attendance"
              )}
            </Button>
          )}

          {error && attended === false && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
