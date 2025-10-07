"use client"

// Event modal that allows officers to view, delete, and open the edit modal

import { Event } from "../event";
import { useEffect, useState } from "react"
import { formatDate } from "./utils";

/**
 * onClose - Function prop that closes the modal
 * isOpen - Modal is open or not, T/F
 * event - Current selected event
 * openEditModal - Opens the editing modal for current selected event
 * events - Events state from page
 * setEvents - Set the Events state when CRUD is performed
 */
interface FormProps {
    onClose: () => {},
    isOpen: boolean
    event: Event,
    openEditModal: () => {},
    events: any[],
    setEvents: (event: any) => void,
}

export default function EventForm ({ onClose, isOpen, event, openEditModal, events, setEvents }: FormProps)  {
    const [confirming, setConfirming] = useState(false);

    const handleDelete = async () => {
        setConfirming(false);
       
        // Delete from Prisma
        await fetch('/api/event', { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: event.id
            })
        })

        const idString = event.id ?? ""; 
        // Delete from Google Calendar
        await fetch('/api/calendar', { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: idString
            })
        }).then(async (res) => { console.log(await res.text()) })

        // Find and remove the deleted event, then update state
        const updatedEvents = events.filter((e : Event) => {
            return e.id != event.id;
        })
        setEvents(updatedEvents);
        onClose();
    }

    // If user closes the modal, close the confirming screen if it's open
    useEffect(() => {
        if(!isOpen){
            setConfirming(false);
        };
    }, [isOpen])

    return (
        <div className="flex flex-row w-lg">
            { confirming ? // Confirmation prompt to make sure delete is intentional
                <div className="flex flex-col fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-md p-4">
                    <p className="py-2 px-4 text-md">Are you sure?</p>
                    <div className="flex flex-row justify-around">
                        <button onClick={ () => setConfirming(false) } className="bg-secondary m-2 rounded-lg px-2 py-1 text-sm">Cancel</button>
                        <button onClick={ handleDelete } className="bg-error m-2 rounded-lg px-2 py-1 text-sm">Delete</button>
                    </div>
                </div>
                :
                <></>
            }
            <div className="flex flex-col">
                <h3 className="px-2 truncate w-80 text-center">{event.title}</h3>
                <p className="text-sm w-80 truncate">When: {formatDate(event.date)}</p>
                <p className="text-sm w-80 truncate">Where: {event.location}</p>
                <p className="text-sm w-80 truncate">Description:</p>
                <p className="text-sm w-80 text-wrap pr-2 grow">{event.description}</p>
                <div className="flex flex-row justify-self-end gap-1">
                    <button onClick={ () => setConfirming(true) } className="text-sm bg-secondary w-full rounded-lg border border-solid border-black">Delete</button>
                    <button onClick={ openEditModal } className="text-sm bg-secondary mr-2 w-full rounded-lg border border-solid border-black">Edit</button>
                </div>
            </div>
            {
                event.image ?
                <img className="w-64 h-64 mr-1 mt-1" src={ event.image } />
                :
                <img className="w-64 h-64 mr-1 mt-1" src="..\..\icon.png"/>
            }
        </div>
    )
}

