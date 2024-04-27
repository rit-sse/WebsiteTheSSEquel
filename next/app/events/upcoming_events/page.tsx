import { Metadata } from "next";
import UpcomingEvents from "./UpcomingEvents";

export const metadata: Metadata = {
    title: "Events Calendar",
    description:
      "The Society of Software Engineers hosts a wide variety of weekly events, ranging from talks and company visits to committee meetings and large seasonal parties."
};

export default function EventsCalendar() {
    return (
        <>
            <div className="text-page-structure">
                <h1>Upcoming Events</h1>
                {/* <div className="subtitle-structure"><p></p></div> */}
                <UpcomingEvents/>

            </div>
        </>
    );
}