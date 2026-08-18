"use client";

import { useEffect, useState } from "react";
import { Event } from "../event";
import { compareDateStrings } from "./utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  Repeat,
  CreditCard,
  Lock,
} from "lucide-react";
import { getAcademicTermEndDate } from "@/lib/academicTerm";
import { toast } from "sonner";

// Required email recipient that is always included for purchase requests
const REQUIRED_RECIPIENT = "softwareengineering@rit.edu";

interface FormProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  setEvents: (event: Event[]) => void;
}

type RecurrenceType = "none" | "weekly" | "biweekly";

interface OfficerLookup {
  is_active: boolean;
  position: { title: string };
  user: { email: string };
}

const COMMITTEES = [
  "Mentoring",
  "Lab Ops",
  "Tech Committee",
  "Events",
  "Talks",
  "Projects",
  "Misc/Presidential",
];

function toDateTimeLocalValue(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

async function getResponseError(response: Response) {
  const text = await response.text();
  if (!text) return `Request failed (${response.status})`;

  try {
    const body = JSON.parse(text);
    return body.error || body.message || text;
  } catch {
    return text;
  }
}

// Generate recurring dates within the semester
function generateRecurringDates(
  startDate: Date,
  recurrence: RecurrenceType
): Date[] {
  if (recurrence === "none") return [startDate];

  const dates: Date[] = [];
  const endDate = getAcademicTermEndDate(startDate);
  const intervalDays = recurrence === "weekly" ? 7 : 14;

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  return dates;
}

export default function AddEventForm({
  isOpen,
  onClose,
  events,
  setEvents,
}: FormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState("");
  const [datetime, setDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [grantsMembership, setGrantsMembership] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");

  // PCard request state
  const [createPurchaseRequest, setCreatePurchaseRequest] = useState(false);
  const [purchaseCommittee, setPurchaseCommittee] = useState("");
  const [purchaseEstimatedCost, setPurchaseEstimatedCost] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseNotifyEmail, setPurchaseNotifyEmail] = useState("");
  const [treasurerEmail, setTreasurerEmail] = useState("treasurer's email");

  // Clear form on close
  useEffect(() => {
    if (!isOpen) {
      clearForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const loadTreasurerEmail = async () => {
      try {
        const response = await fetch("/api/officer");
        if (!response.ok) return;
        const officers = (await response.json()) as OfficerLookup[];
        const treasurer = officers.find(
          (officer) =>
            officer.is_active && officer.position.title === "Treasurer"
        );
        if (treasurer?.user?.email) {
          setTreasurerEmail(treasurer.user.email);
        }
      } catch (error) {
        console.error("Failed to load treasurer email:", error);
      }
    };
    loadTreasurerEmail();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!eventName || !datetime || !endDatetime) {
      setError("Event name, start date/time, and end date/time are required");
      setLoading(false);
      return;
    }

    const startDate = new Date(datetime);
    const endDate = new Date(endDatetime);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Start and end date/times must be valid");
      setLoading(false);
      return;
    }

    if (endDate <= startDate) {
      setError("End date/time must be after the start date/time");
      setLoading(false);
      return;
    }

    // Validate purchase request fields if enabled (notifyEmail is optional since REQUIRED_RECIPIENT is always included)
    if (createPurchaseRequest) {
      if (!purchaseCommittee || !purchaseEstimatedCost) {
        setError("Please fill in all required PCard request fields");
        setLoading(false);
        return;
      }

      const requestDescription =
        purchaseDescription || `Purchase for event: ${eventName}`;
      if (requestDescription.length > 1000) {
        setError(
          "PCard purchase descriptions must be 1,000 characters or fewer"
        );
        setLoading(false);
        return;
      }
    }

    // Reformat googledrive image link so that <img> can display it
    const googleImageMatch = image.match(RegExp("d/([^/]+)/view"));
    const googleImageLink = googleImageMatch
      ? `https://drive.google.com/thumbnail?id=${googleImageMatch[1]}`
      : "";

    try {
      const recurringDates = generateRecurringDates(startDate, recurrence);
      const duration = endDate.getTime() - startDate.getTime();
      const newEvents: Event[] = [];
      let purchaseRequestFailure: string | null = null;

      for (let i = 0; i < recurringDates.length; i++) {
        const eventDate = recurringDates[i];
        const eventEndDate = new Date(eventDate.getTime() + duration);
        const eventTitle =
          recurringDates.length > 1 ? `${eventName}` : eventName;

        // Post to Google Calendar
        const gCalResponse = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: eventTitle,
            location: location,
            description: description,
            start: eventDate.toISOString(),
            end: eventEndDate.toISOString(),
          }),
        });

        if (!gCalResponse.ok) {
          // If Google Calendar fails, create without it
          console.warn(
            "Google Calendar sync failed, creating event locally only"
          );
          toast.warning(
            "Google Calendar sync failed. The event was saved locally, but will not appear on the calendar."
          );
        }

        const gCalEvent = gCalResponse.ok
          ? await gCalResponse.json()
          : { id: `local-${Date.now()}-${i}` };
        const gCalID = gCalEvent.id;

        // Post to Prisma
        const prismaResponse = await fetch("/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: gCalID,
            title: eventTitle,
            location: location,
            description: description,
            date: eventDate.toISOString(),
            endDate: eventEndDate.toISOString(),
            image: googleImageLink,
            attendanceEnabled: attendanceEnabled,
            grantsMembership: grantsMembership,
          }),
        });

        if (prismaResponse.ok) {
          const newEvent = await prismaResponse.json();
          newEvents.push(newEvent);

          // Create linked purchase request if enabled (only for first event in recurring series)
          if (createPurchaseRequest && i === 0) {
            try {
              const purchaseResponse = await fetch("/api/purchasing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: eventName,
                  committee: purchaseCommittee,
                  description:
                    purchaseDescription || `Purchase for event: ${eventName}`,
                  estimatedCost: parseFloat(purchaseEstimatedCost),
                  plannedDate: eventDate.toISOString(),
                  notifyEmail: purchaseNotifyEmail,
                  eventId: newEvent.id,
                }),
              });

              if (!purchaseResponse.ok) {
                purchaseRequestFailure =
                  await getResponseError(purchaseResponse);
              } else {
                const newPurchaseRequest = await purchaseResponse.json();
                try {
                  const emailResponse = await fetch(
                    `/api/purchasing/${newPurchaseRequest.id}/email`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "checkout" }),
                    }
                  );
                  if (!emailResponse.ok) {
                    toast.warning(
                      "PCard request was created, but its email notification could not be sent."
                    );
                  }
                } catch (emailError) {
                  console.warn(
                    "Failed to send purchase request email:",
                    emailError
                  );
                  // Don't fail the whole operation if email fails
                }
              }
            } catch (purchaseError) {
              console.warn("Failed to create purchase request:", purchaseError);
              purchaseRequestFailure =
                "Unable to reach the PCard request service";
            }
          }
        } else {
          const errorData = await prismaResponse.json().catch(() => null);
          setError(
            errorData?.error ||
              "Failed to save event to database. The Google Calendar event was created but the event won't appear on the attendance page."
          );
          setLoading(false);
          return;
        }
      }

      // Append new events and sort chronologically
      const updatedEvents = [...events, ...newEvents];
      updatedEvents.sort((event1, event2) =>
        compareDateStrings(event1.date, event2.date)
      );
      setEvents(updatedEvents);

      if (purchaseRequestFailure) {
        toast.error(
          `Event created, but PCard request was not submitted: ${purchaseRequestFailure}`
        );
      }

      onClose();
      clearForm();
    } catch (err) {
      console.error(err);
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEventName("");
    setLocation("");
    setDatetime("");
    setEndDatetime("");
    setDescription("");
    setImage("");
    setAttendanceEnabled(false);
    setGrantsMembership(false);
    setRecurrence("none");
    setCreatePurchaseRequest(false);
    setPurchaseCommittee("");
    setPurchaseEstimatedCost("");
    setPurchaseDescription("");
    setPurchaseNotifyEmail("");
    setError(null);
  };

  // Calculate how many events will be created
  const getRecurrencePreview = () => {
    if (!datetime || recurrence === "none") return null;
    const dates = generateRecurringDates(new Date(datetime), recurrence);
    if (dates.length <= 1) return null;
    return `This will create ${dates.length} events through the end of the semester`;
  };

  const handleStartDateTimeChange = (value: string) => {
    setDatetime(value);
    const start = new Date(value);
    const currentEnd = new Date(endDatetime);
    if (
      !Number.isNaN(start.getTime()) &&
      (Number.isNaN(currentEnd.getTime()) || currentEnd <= start)
    ) {
      setEndDatetime(toDateTimeLocalValue(new Date(start.getTime() + 3600000)));
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Event Details */}
        <div className="space-y-4">
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
              onChange={(e) => handleStartDateTimeChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDatetime">End Date & Time *</Label>
            <Input
              id="endDatetime"
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrence" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurrence
            </Label>
            <Select
              value={recurrence}
              onValueChange={(val) => setRecurrence(val as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  No recurrence (single event)
                </SelectItem>
                <SelectItem value="weekly">
                  Weekly (until end of semester)
                </SelectItem>
                <SelectItem value="biweekly">
                  Bi-weekly (until end of semester)
                </SelectItem>
              </SelectContent>
            </Select>
            {getRecurrencePreview() && (
              <p className="text-xs text-muted-foreground">
                {getRecurrencePreview()}
              </p>
            )}
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
        </div>

        {/* Right Column - Options */}
        <div className="space-y-4">
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
                  setAttendanceEnabled(checked === true);
                  if (!checked) {
                    setGrantsMembership(false);
                  }
                }}
              />
              <Label
                htmlFor="attendanceEnabled"
                className="text-sm font-normal cursor-pointer"
              >
                Enable attendance tracking
              </Label>
            </div>

            {attendanceEnabled && (
              <div className="flex items-center gap-3 ml-6">
                <Checkbox
                  id="grantsMembership"
                  checked={grantsMembership}
                  onCheckedChange={(checked) =>
                    setGrantsMembership(checked === true)
                  }
                />
                <Label
                  htmlFor="grantsMembership"
                  className="text-sm font-normal cursor-pointer"
                >
                  Grant membership to attendees
                </Label>
              </div>
            )}
          </div>

          {/* PCard Request Options */}
          <div className="space-y-3 p-4 bg-surface-2 rounded-lg border">
            <Label className="flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4" />
              PCard Request
            </Label>

            <div className="flex items-center gap-3">
              <Checkbox
                id="createPurchaseRequest"
                checked={createPurchaseRequest}
                onCheckedChange={(checked) =>
                  setCreatePurchaseRequest(checked === true)
                }
              />
              <Label
                htmlFor="createPurchaseRequest"
                className="text-sm font-normal cursor-pointer"
              >
                Create a PCard request for this event
              </Label>
            </div>

            {createPurchaseRequest && (
              <div className="space-y-3 pt-2 border-t mt-2">
                <div className="space-y-2">
                  <Label htmlFor="purchaseCommittee" className="text-sm">
                    Committee *
                  </Label>
                  <Select
                    value={purchaseCommittee}
                    onValueChange={setPurchaseCommittee}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="purchaseEstimatedCost" className="text-sm">
                    Estimated Cost *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="purchaseEstimatedCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseEstimatedCost}
                      onChange={(e) => setPurchaseEstimatedCost(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseDescription" className="text-sm">
                    What are you purchasing?
                  </Label>
                  <Textarea
                    id="purchaseDescription"
                    value={purchaseDescription}
                    onChange={(e) => setPurchaseDescription(e.target.value)}
                    placeholder="Describe what you're purchasing..."
                    rows={2}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {purchaseDescription.length}/1000 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Send notification to</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{REQUIRED_RECIPIENT}</span>
                    <span className="text-xs text-muted-foreground">
                      (always included)
                    </span>
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="purchaseNotifyEmail" className="text-xs">
                      Additional notification emails (optional)
                    </Label>
                    <Input
                      id="purchaseNotifyEmail"
                      type="email"
                      value={purchaseNotifyEmail}
                      onChange={(e) => setPurchaseNotifyEmail(e.target.value)}
                      placeholder={treasurerEmail}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Event"
          )}
        </Button>
      </div>
    </form>
  );
}
