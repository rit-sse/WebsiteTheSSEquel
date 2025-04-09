"use client"
import { useState, useEffect } from 'react';
import { Event } from '../event';

interface Props {
  events: Event[]
}

const Calendar = ({ events }: Props) => {
    // standard link is in week mode, agenda is in agenda mode
    const standardCalendarLink = "https://calendar.google.com/calendar/embed?mode=WEEK&height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%233F51B5";
    const agendaCalendarLink = "https://calendar.google.com/calendar/embed?mode=AGENDA&height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%233F51B5";

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
    }, []); // Empty array ensures that effect is only run on mount

    // Hacky way to force this component to refresh when the events state is changed
    const [key, setKey] = useState(0);
    useEffect(() =>{
      setKey(Date.now());
    }, [events])

  return (
    <iframe
        key={key}
        src={calendarLink}
        className="border border-solid border-gray-700 w-full h-full rounded-lg"
        frameBorder="0"
        scrolling="no"
    />
  )
}

export default Calendar;