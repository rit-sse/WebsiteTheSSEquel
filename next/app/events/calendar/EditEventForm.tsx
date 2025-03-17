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
    const [loading, setLoading] =  useState(false);
    const [eventName, setEventName] = useState("");
    const [location, setLocation] = useState("");
    const [datetime, setDatetime] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");

    // Fill in the event card when the modal is opened
    useEffect(() => {
        if(isOpen){
            const date: Date = new Date(event.date);
            const offset = date.getTimezoneOffset() * 60000;
            setEventName(event.title ?? "");
            setLocation(event.location ?? "");
            setDatetime(new Date(date.getTime() - offset).toISOString().slice(0, 16) ?? "");
            setDescription(event.description ?? "");
            setImage(event.image ?? "");
            setModalEvent(false);
        }
    }, [isOpen]);

    const onSave = async (e: any) =>{
        e.preventDefault();
        setLoading(true);

        // Reformat googledrive image link so that <img> can display it
        const googleImageMatch = image.match(RegExp("d/([^/]+)/view"));
        var googleImageLink = googleImageMatch ? `https://drive.google.com/thumbnail?id=${googleImageMatch[1]}` : "";

        // Update to Prisma
        const res = await fetch('http://localhost:3000/api/event', { 
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
        const idString = newEvent.id.toString();

        // Update to Google Calendar
        await fetch('http://localhost:3000/api/event/calendar', { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: "0".repeat(5 - idString.length).concat(idString),
                title: eventName,
                location: location,
                description: description,
                date: new Date(datetime).toISOString(),
                image: googleImageLink
            })
        }).then(async (res) => { console.log(await res.text()) })

        // Update the events state to reflect change
        let updatedEvents = events.filter((e : Event) => {
            return (e as Event).id != newEvent.id;
        })
        updatedEvents.push(newEvent);
        updatedEvents.sort((event1, event2) => compareDateStrings(event1.date, event2.date));
        setEvents(updatedEvents);
        setSelectedEvent(newEvent);
        setModalEvent(true);
        setLoading(false);
        onClose();
        clearForm();
    }

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
            <input className="bg-base-100" placeholder="Event Name" value={eventName} onChange={(e) => setEventName(e.target.value)}/>

            <label className="-mb-2">Location</label>
            <input className="bg-base-100" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)}/>

            <label className="-mb-2">Date & Time</label>
            <input type="datetime-local" className="bg-base-100" placeholder="MM/DD/YYYY" value={datetime} onChange={(e) => setDatetime(e.target.value)}/>

            <label className="-mb-2">Description</label>
            <textarea className="bg-base-100" placeholder="(Optional)" value={description} onChange={(e) => setDescription(e.target.value)}/>

            <label className="-mb-2">Event Image</label>
            <input className="bg-base-100" placeholder="Google Drive Link" value={image} onChange={(e) => setImage(e.target.value)}/>

            { loading ?
                <p className="border border-solid border-gray-700 bg-secondary text-base-content text-center text-base">Loading...</p>
                :
                <button onClick={ onSave } className="border border-solid border-gray-700 bg-secondary text-base-content hover:bg-primary">Save Changes</button>
            }
        </form>
    )
}

