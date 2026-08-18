"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Event } from "../event";
import { Pencil, Plus } from "lucide-react";

interface Props {
  modalAdd: () => void;
  events: Event[];
  onEditEvent: (event: Event) => void;
}

const ManageEventCard = ({ modalAdd, events, onEditEvent }: Props) => {
  const [isOfficer, setIsOfficer] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch("/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
      } catch (error) {
        console.error("Error checking auth level:", error);
      }
    };
    checkUserStatus();
  }, []);

  if (!isOfficer) {
    return null;
  }

  return (
    <Card className="p-4 shrink-0">
      <h3 className="text-lg font-semibold mb-3 text-center">Manage Events</h3>
      <Button onClick={modalAdd} className="w-full">
        <Plus className="h-4 w-4" />
        Add Event
      </Button>
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Edit Event
        </p>
        <Select
          value={selectedEventId}
          onValueChange={(eventId) => {
            setSelectedEventId("");
            const event = events.find((candidate) => candidate.id === eventId);
            if (event) onEditEvent(event);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events
              .filter((event): event is Event & { id: string } =>
                Boolean(event.id)
              )
              .map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} ({new Date(event.date).toLocaleDateString()})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The embedded calendar is view-only. Select an event here to edit it.
        </p>
      </div>
    </Card>
  );
};

export default ManageEventCard;
