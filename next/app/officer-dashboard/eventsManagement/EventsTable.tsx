import {FC, useState, useEffect} from "react"; 

type EventStructure = {
    id: number;
    title: string;
    description: string;
    date: string;
    image: string;
    location: string;
};

const EventsTable: FC<{ isOfficer: boolean, events: Array<EventStructure> }> = ({ isOfficer, events }) => {
    return (<div>
        {events.map(event => (
            <div key={event.id}>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <p>{event.date}</p>
                <p>{event.location}</p>
                <img src={event.image} alt={event.title} />
            </div>
        ))}
    </div>
    )
}

export default EventsTable;