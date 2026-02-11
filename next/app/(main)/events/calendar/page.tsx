"use client"
import Calendar from "./Calendar";
import { Event } from "../event";
import { Modal } from "@/components/ui/modal";
import { useEffect, useState } from "react";
import AddEventForm from "./AddEventForm";
import EventForm from "./EventForm";
import EditEventForm from "./EditEventForm";
import ManageEventsCard from "./ManageEventsCard";
import { compareDateStrings } from "./utils";
import { Card } from "@/components/ui/card";

export default function EventsCalendar() {
    const [modalAdd, setModalAdd] = useState(false); // Modal for adding new events
    const [modalEdit, setModalEdit] = useState(false); // Modal for editing events
    const [modalEvent, setModalEvent] = useState(false); // Modal for viewing event details
    
    // These states are shared by the modals
    const [selectedEvent, setSelectedEvent] = useState<Event>({} as Event); // Current event being viewed
    const [events, setEvents] = useState<Event[]>([]); // Array of all events

    useEffect(() => {
        fetchEvents();
    }, []);

    /**
     * Get all events from Google Calendar
     */
    const fetchEvents = async () => {
        try {
            const resp = await fetch('/api/event');
            const res = await resp.json();
            if (Array.isArray(res)) {
                const sorted = res.sort((event1, event2) => compareDateStrings(event1.date, event2.date));
                setEvents(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    }

    return (
        <>
            <Card className="flex flex-col w-full max-w-[94vw] xl:max-w-[1400px] p-6 md:p-10 mx-auto mt-8">            
                <h1 className="text-foreground text-left mb-6">
                    Events Calendar
                </h1>
                <div className="flex flex-col lg:flex-row w-full gap-6">
                    <div className="flex-1 min-w-0 overflow-x-auto">
                        <Calendar events={ events }/>
                    </div>

                    {/* Card that only officers can see */}
                    <ManageEventsCard modalAdd={() => setModalAdd(true)} />
                </div>
            </Card>

            {/* Modal for adding a new event */}
            <Modal open={modalAdd} onOpenChange={setModalAdd} title="Add Event" className="!max-w-4xl">
                <AddEventForm isOpen={modalAdd} onClose={() => setModalAdd(false)} events={events} setEvents={setEvents}/>
            </Modal>

            {/* Modal for viewing / deleting an event */}
            <Modal open={modalEvent} onOpenChange={setModalEvent} title="Event Details">
                <EventForm isOpen={modalEvent} onClose={() => setModalEvent(false)} event={selectedEvent} openEditModal={() => setModalEdit(true)} events={events} setEvents={setEvents}/>
            </Modal>

            {/* Modal for editing an event */}
            <Modal open={modalEdit} onOpenChange={setModalEdit} title="Edit Event">
                <EditEventForm isOpen={modalEdit} onClose={() => setModalEdit(false)} setModalEvent={setModalEvent} event={selectedEvent} setSelectedEvent={setSelectedEvent} events={events} setEvents={setEvents}/>
            </Modal>
        </>
    );
}
