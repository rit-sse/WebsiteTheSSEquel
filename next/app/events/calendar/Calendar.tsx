"use client"
import { useState, useEffect } from 'react';

const Calendar = () => {
    const standardCalendarLink = "https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=ZXNoNzk0M0BnLnJpdC5lZHU&src=YWRkcmVzc2Jvb2sjY29udGFjdHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%2333B679&color=%230B8043&color=%233F51B5";
    const agendaCalendarLink = "https://calendar.google.com/calendar/embed?mode=AGENDA&height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=ZXNoNzk0M0BnLnJpdC5lZHU&src=YWRkcmVzc2Jvb2sjY29udGFjdHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%2333B679&color=%230B8043&color=%233F51B5";

    const [calendarLink, setCalendarLink] = useState(standardCalendarLink);

    useEffect(() => {
        // only execute all the code below in client side
        // Handler to call on window resize
        function handleResize() {
        // Set window width/height to state
        if (window.innerWidth > 768) {
            setCalendarLink(standardCalendarLink)
        } else {
            setCalendarLink(agendaCalendarLink)
        }
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
     
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return (
    <iframe
        src={calendarLink}
        className="border border-solid border-gray-700 w-full h-full"
        frameBorder="0"
        scrolling="no"
    />
  )
}

export default Calendar;