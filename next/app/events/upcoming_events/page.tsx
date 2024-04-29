"use client"
import { Event } from "../event";
import UpcomingEvents from "./UpcomingEvents";
import { useCallback, useEffect, useState } from "react";

export interface EventProps {
    id: number;
    title: string;
    description: string;
    date: string; // change to a Date type sometime soon
    image: string;
    location: string;
    fetchData: () => Promise<void>; 
}

export interface UpcomingEventsProps {
    eventsData: Event[];
    fetchData: () => Promise<void>; 
}

export default function UpcomingEventsPage() {
    const [eventsData, setEventsData] = useState([]);
    const fetchData = useCallback(async() => {
        const response = await fetch("http://localhost:3000/api/event");
        const data = await response.json();
        
        setEventsData(data.map((item: { title: string; description: string; date: string; image: string; location: string;}) => ({
            title: item.title,
            date: item.date, 
            location: item.location,
            image: item.image, //TODO remove prepending /images/
            description: item.description
        })));
    }, [])
    useEffect(() => {
        fetchData()
    }, [fetchData]);

    useEffect(() => {}, [eventsData]); 
    
    return (
        <>
            {console.log(eventsData)}
            <div className="text-page-structure">
                <h1>Upcoming Events</h1>
                {/* <div className="subtitle-structure"><p></p></div> */}
                <UpcomingEvents eventsData={eventsData} fetchData={fetchData}/>

            </div>
        </>
    );
}