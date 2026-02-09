"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Event } from '../event';

interface Props {
  events: Event[]
}

const Calendar = ({ events }: Props) => {
    const searchParams = useSearchParams();
    const eventIdParam = searchParams.get('eventId');
    
    // Build the date parameter for Google Calendar if we have a focus event
    let dateQueryParam = "";
    if (eventIdParam && events.length > 0) {
        try {
            // Find the event by ID
            const targetEvent = events.find(event => event.id === eventIdParam);
            if (targetEvent && targetEvent.date) {
                // Parse the event's ISO date and format it as YYYYMMDD for Google Calendar
                const targetDate = new Date(targetEvent.date);
                if (!isNaN(targetDate.getTime())) {
                    const year = targetDate.getFullYear();
                    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                    const day = String(targetDate.getDate()).padStart(2, '0');
                    const formattedDate = `${year}${month}${day}`;
                    // Google Calendar dates param format: dates=YYYYMMDD/YYYYMMDD (start/end of range)
                    dateQueryParam = `&dates=${formattedDate}/${formattedDate}`;
                }
            }
        } catch (e) {
            console.error("Failed to find event or parse date:", e);
        }
    }
    
    // standard link is in week mode, agenda is in agenda mode
    const standardCalendarLink = `https://calendar.google.com/calendar/embed?mode=WEEK&height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%233F51B5${dateQueryParam}`;
    const agendaCalendarLink = `https://calendar.google.com/calendar/embed?mode=AGENDA&height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%233F51B5${dateQueryParam}`;

    const [calendarLink, setCalendarLink] = useState(standardCalendarLink);

    useEffect(() => {
      // only execute all the code below in client side
      // Handler to call on window resize
      function handleResize() {
          window.innerWidth > 768 ?
          setCalendarLink(standardCalendarLink) :
          setCalendarLink(agendaCalendarLink)
      }
      
      // Add event listener
      window.addEventListener("resize", handleResize);
      
      // Call handler right away so state gets updated with initial window size
      handleResize();
      
      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize);
    }, [standardCalendarLink, agendaCalendarLink]); // Re-run when date param changes

    // Hacky way to force this component to refresh when the events state is changed or URL param changes
    const [key, setKey] = useState(0);
    useEffect(() =>{
      setKey(Date.now());
    }, [events, eventIdParam])

  return (
    <iframe
        key={key}
        src={calendarLink}
        className="border border-solid border-gray-700 w-full h-[calc(100vh-280px)] min-h-[400px] rounded-lg"
        frameBorder="0"
        scrolling="no"
    />
  )
}

export default Calendar;