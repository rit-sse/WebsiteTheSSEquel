"use client"

// Event modal to add a new event

import { useEffect, useState } from "react"
import { Event } from "../event";
import { compareDateStrings } from "./utils";

/**
 * isOpen - Modal is open or not, T/F
 * onClose - Function prop that closes the modal
 * events - Events state from page
 * setEvents - Set the Events state when CRUD is performed
 */
interface FormProps {
    isOpen: boolean,
    onClose: () => {},
    events: Event[],
    setEvents: (event: Event[]) => void,
}

export default function AddEventForm ({ isOpen, onClose, events, setEvents }: FormProps)  {
    const [loading, setLoading] =  useState(false);
    const [eventName, setEventName] = useState("");
    const [location, setLocation] = useState("");
    const [datetime, setDatetime] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");

    // Clear form on close
    useEffect(() =>{
        if(!isOpen){
            clearForm();
        }
    }, [isOpen]);

    const onSubmit = async (event: any) =>{
        event.preventDefault();
        setLoading(true);

        // Reformat googledrive image link so that <img> can display it
        const googleImageMatch = image.match(RegExp("d/([^/]+)/view"));
        var googleImageLink = googleImageMatch ? `https://drive.google.com/thumbnail?id=${googleImageMatch[1]}` : "";
    
        // Post to Prisma
        const res = await fetch('http://localhost:3000/api/event', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: eventName,
                location: location,
                description: description,
                date: new Date(datetime).toISOString(),
                image: googleImageLink
            })
        })
        const newEvent = await res.json();
        const idString = newEvent.id.toString();

        // Post to Google Calendar
        await fetch('http://localhost:3000/api/event/calendar', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: "0".repeat(5 - idString.length).concat(idString),
                title: eventName,
                location: location,
                description: description,
                date: new Date(datetime).toISOString(),
            })
        }).then(async (res) => { console.log(await res.text()) })
        let updatedEvents: Event[] = [...events, newEvent];
        updatedEvents.sort((event1, event2) => compareDateStrings(event1.date, event2.date));
        setEvents(updatedEvents);
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
        <form className="flex flex-col gap-2" onSubmit={(event) => onSubmit(event)}>
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
                <input type="submit" className="border border-solid border-gray-700 bg-secondary text-base-content hover:bg-primary"/>
            }
        </form>
    )
}

