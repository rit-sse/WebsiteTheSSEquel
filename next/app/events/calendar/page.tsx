"use client"
import Calendar from "./Calendar";
import { Event } from "../event";
import EventFormModal from "./EventFormModal";
import { useEffect, useState } from "react";
import AddEventForm from "./AddEventForm";
import EventForm from "./EventForm";
import EditEventForm from "./EditEventForm";
import ManageEventsCard from "./ManageEventsCard";
import { compareDateStrings } from "./utils";

export default function EventsCalendar() {
    const [modalAdd, setModalAdd] = useState(false);
    const [modalEdit, setModalEdit] = useState(false);
    const [modalEvent, setModalEvent] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event>({} as Event);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () =>{
        const resp = await fetch('http://localhost:3000/api/event');
        let res: Event[] = await resp.json();
        res = res.sort((event1, event2) => compareDateStrings(event1.date, event2.date))
        setEvents(res);
    }

    return (
        <>
            <div className="flex flex-col items-center w-full h-screen max-w-screen-xl">            
                <div className="mx-auto px-4 sm: py-16 md:pb-8 max-w-2xl">
                    <div className="text-center flex flex-col items-center w-full">
                        <h1
                        className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                    text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                        >
                        Events Calendar
                        </h1>
                    </div>
                </div>
                <div className="flex flex-row max-md:flex-col max-md:items-center w-full h-screen max-w-screen-xl gap-1 ">
                    <Calendar events={ events }/>

                    {/* Card that only officers can see, props are functions to open the modals */}
                    <ManageEventsCard modalAdd={ () => setModalAdd(true) } modalEvent={ () => setModalEvent(true) } setSelectedEvent={ setSelectedEvent } events={ events }/>
                </div>

                {/* Modals that contain the form for adding a new event */}
                <EventFormModal isOpen={ modalAdd } onClose={ async () => setModalAdd(false) } >
                    <AddEventForm isOpen={ modalAdd } onClose={ async () => setModalAdd(false) } events={ events } setEvents={ setEvents }/>
                </EventFormModal>

                {/* Modals that contain the form for viewing / deleting an event */}
                <EventFormModal isOpen={ modalEvent } onClose={ async () => setModalEvent(false)}>
                    <EventForm isOpen={ modalEvent } onClose={ async () => setModalEvent(false)} event={ selectedEvent } openEditModal={ async () => setModalEdit(true) } events={ events } setEvents={ setEvents }/>
                </EventFormModal>

                {/* Modals that contain the form for editing an event */}
                <EventFormModal isOpen={ modalEdit } onClose={ async () => setModalEdit(false)}>
                    <EditEventForm isOpen={ modalEdit } onClose={ async () => setModalEdit(false)} setModalEvent={ setModalEvent } event={ selectedEvent } setSelectedEvent={ setSelectedEvent } events={ events } setEvents={ setEvents }/>
                </EventFormModal>
            </div>
        </>
    );
}