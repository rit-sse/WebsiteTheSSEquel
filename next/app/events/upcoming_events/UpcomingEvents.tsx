"use client"
import { EventCard } from '../EventCard'
import { Event } from '../event';
import { UpcomingEventsProps } from './page';

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ eventsData, fetchData }) => {
   const currentDate = new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: '2-digit' 
    }).format(new Date());
   
   return (
        <>
         <div className="upcoming-collapse pt-6">
            <div className="collapse collapse-arrow bg-base-200 collapse-child">
               <input type="checkbox" id="today-collapse" className="peer" />
               <label htmlFor="today-collapse" className="collapse-title text-xl font-medium">
                  Today ({currentDate})
               </label>
               <div className="collapse-content"> 
                  {eventsData.map((item: Event) => (
                     <EventCard key={item.id} {...item}/>
                  ))}
               </div>
            </div>
         </div>

         <div className="upcoming-collapse">
            <div className="collapse collapse-arrow bg-base-200 collapse-child">
               <input type="checkbox" id="week-collapse" className="peer" />
               <label htmlFor="week-collapse" className="collapse-title text-xl font-medium">
                  This Week
               </label>
               <div className="collapse-content"> 
                  <p>hello</p>
               </div>
            </div>
         </div>

         <div className="upcoming-collapse">
            <div className="collapse collapse-arrow bg-base-200 collapse-child">
               <input type="checkbox" id="month-collapse" className="peer" />
               <label htmlFor="month-collapse" className="collapse-title text-xl font-medium">
                  This Month
               </label>
               <div className="collapse-content"> 
                  <p>hello</p>
               </div>
            </div>
         </div>

         <div className="upcoming-collapse">
            <div className="collapse collapse-arrow bg-base-200 collapse-child">
               <input type="checkbox" id="3month-collapse" className="peer" />
               <label htmlFor="3month-collapse" className="collapse-title text-xl font-medium">
                  Next 3 Months
               </label>
               <div className="collapse-content"> 
                  <p>hello</p>
               </div>
            </div>
         </div>
        </>
   );
}

export default UpcomingEvents;