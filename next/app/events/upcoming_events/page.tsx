"use client"
import { Metadata } from "next";
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
    eventsData: EventProps[];
    fetchData: () => Promise<void>; 
}

export default function EventsCalendar() {
    const [eventsData, setEventsData] = useState([]);
    const fetchData = useCallback(async() => {
        const response = await fetch("http://localhost:3000/api/event");
        const data = await response.json();
        
        setEventsData(data.map((item: { id: number, title: string; description: string; date: string; image: string; location: string;}) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            date: item.date, 
            image: item.image ?? '', 
            location: item.location ?? ''
        })));
    }, [])
    useEffect(() => {
        fetchData()
    }, [fetchData]);

    useEffect(() => {}, [eventsData]); 
    
    return (
        <>
            <div className="text-page-structure">
                <h1>Upcoming Events</h1>
                {/* <div className="subtitle-structure"><p></p></div> */}
                <UpcomingEvents eventsData={eventsData} fetchData={fetchData}/>


            </div>
        </>
    );
}