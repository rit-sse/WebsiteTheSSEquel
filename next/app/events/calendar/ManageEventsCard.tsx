"use client"

// Card that only officers can see that allow them to perform CRUD on events

import { useEffect, useState } from "react";
import { Event } from "../event";

/**
 * modalAdd - Open modal that adds new events
 * modalEvent - Open modal to view / delete / edit the selected event
 * setSelectedEvent - Set the selected event for modalEvent
 * events - Events state from page
 */
interface Props {
    modalAdd: () => void,
    modalEvent: () => void,
    setSelectedEvent: (event: Event) => void,
    events: Event[],
}

const ManageEventCard = ({ modalAdd, modalEvent, setSelectedEvent, events }: Props) => {
    const [isOfficer, setIsOfficer] = useState(false);

    useEffect(() => {
        userStatus();  
    }, []);

    const userStatus = async () =>{
        const response = await fetch("/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    /**
     * Open the event modal using ID of targeted event (Event ID based on Google API)
     * @param event Event fired by mouse click
     */
    const openEventModal = (event: any) => {
        event.preventDefault();
        const selectedEvent = events.filter((e : Event) => {
            if((e as Event).id == event.target.value){
                return true;
            }
        })
        setSelectedEvent(selectedEvent[0]);
        modalEvent();
    } 

    if(isOfficer){
        return(
            <div className="max-md:w-full w-1/5 flex flex-col items-center z-1 border border-solid border-gray-700 drop-shadow-xl bg-background rounded-lg">
                <div className="mt-2">
                    <h3 className="text-center">Modify Events</h3>
                </div>
                <button className="bg-secondary rounded-full text-center w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-primary shadow-md active:bg-muted text-primary-foreground" onClick={ modalAdd }>+</button>
                <div className="py-5 flex flex-col gap-2 w-full px-2 overflow-y-auto max-h-96">

                    {Object.entries(events).map(([key, event]) => (
                    // Display all stored events
                    <button key={ key } onClick={ openEventModal } value={ (event as Event).id } className="text-sm bg-secondary hover:bg-primary rounded-md flex justify-center items-center min-h-12 active:bg-muted truncate text-primary-foreground">
                        { (event as Event).title }
                    </button>
                    ))}
                    
                </div>
            </div>
        )
    }
}

export default ManageEventCard;
