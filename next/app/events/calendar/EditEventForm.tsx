"use client"

// Event modal to edit an event

import { useEffect, useState } from "react"
import { Event } from "../event";
import { compareDateStrings } from "./utils";

/**
 * isOpen - Modal is open or not, T/F
 * onClose - Function prop that closes the modal
 * setModalEvent - Set the open/close state of the viewing modal of the selected event
 * event - Current selected event
 * setSelectedEvent - Set the current selected event
 * events - Events state from page
 * setEvents - Set the Events state when CRUD is performed
 */
interface FormProps {
    isOpen: boolean,
    onClose: () => {},
    setModalEvent: (state: boolean) => void,
    event: Event,
    setSelectedEvent: (event: Event) => void,
    events: Event[],
    setEvents: (event: Event[]) => void,
}

export default function EditEventForm ({ isOpen, onClose, setModalEvent, event, setSelectedEvent, events, setEvents }: FormProps)  {
    const [loading, setLoading] =  useState(false); // Toggled while waiting for API to respond

    // States for holding form data
    const [eventName, setEventName] = useState("");
    const [location, setLocation] = useState("");
    const [datetime, setDatetime] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");

    // Fill in the event card with event data when the modal is opened
    useEffect(() => {
        if(isOpen){
            // Convert UTC time to New York TimeZone (EST/EDT)
            const date: Date = new Date(event.date);
            const offset = date.getTimezoneOffset() * 60000;
            setEventName(event.title ?? "");
            setLocation(event.location ?? "");
            // Slice timezone indicator off at end of ISOString
            setDatetime(new Date(date.getTime() - offset).toISOString().slice(0, 16) ?? "");
            setDescription(event.description ?? "");
            setImage(event.image ?? "");
            setModalEvent(false);
        }
    }, [isOpen]);

    const onSave = async (e: any) =>{
        e.preventDefault();
        setLoading(true);

        // Reformat googledrive image share link so that <img> can display it
        const googleImageMatch = image.match(RegExp("d/([^/]+)/view"));
        var googleImageLink = googleImageMatch ? `https://drive.google.com/thumbnail?id=${googleImageMatch[1]}` : "";

        // Update to Prisma
        const res = await fetch('/api/event', { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: event.id,
                title: eventName,
                location: location,
                description: description,
                date: new Date(datetime).toISOString(),
                image: googleImageLink
            })
        })

        const newEvent = await res.json();
        const gCalID = newEvent.id;

        // Update to Google Calendar
        await fetch('/api/calendar', { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: gCalID,
                summary: eventName,
                location: location,
                description: description,
                start: new Date(datetime).toISOString(),
                end: new Date(new Date(datetime).getTime() + 60 * 60 * 1000).toISOString()
            })
        }).then((res) => console.log(res.text()))

        // Find and remove the old event
        let updatedEvents = events.filter((e : Event) => {
            return (e as Event).id != newEvent.id;
        })
        // Add the updated event, sort chronologically and set new state
        updatedEvents.push(newEvent);
        updatedEvents.sort((event1, event2) => compareDateStrings(event1.date, event2.date));
        setEvents(updatedEvents);
        setSelectedEvent(newEvent);
        setModalEvent(true);
        setLoading(false);
        onClose();
        clearForm();
    }

    /**
     * Clears all values in the form, called when form is closed or submitted
     */
    const clearForm = () => {
        setEventName("");
        setLocation("");
        setDatetime("");
        setDescription("");
        setImage("");
    }

    return (
        <form className="flex flex-col gap-2">
            <label className="-mb-2">Event Name</label>
            <input className="bg-background" placeholder="Event Name" value={eventName} onChange={(e) => setEventName(e.target.value)}/>

            <label className="-mb-2">Location</label>
            <input className="bg-background" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)}/>

            <label className="-mb-2">Date & Time</label>
            <input type="datetime-local" className="bg-background" placeholder="MM/DD/YYYY" value={datetime} onChange={(e) => setDatetime(e.target.value)}/>

            <label className="-mb-2">Description</label>
            <textarea className="bg-background" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}/>

            <label className="-mb-2">Event Image</label>
            <input className="bg-background" placeholder="Google Drive Share Link" value={image} onChange={(e) => setImage(e.target.value)}/>

            { loading ?
                <p className="border border-solid border-gray-700 bg-secondary text-foreground text-center text-base">Loading...</p>
                :
                <button onClick={ onSave } className="border border-solid border-gray-700 bg-secondary text-foreground hover:bg-primary">Save Changes</button>
            }
        </form>
    )
}

