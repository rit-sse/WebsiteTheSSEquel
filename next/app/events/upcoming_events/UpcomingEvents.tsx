"use client"
import { useState, useEffect } from 'react';

const UpcomingEvents = () => {
   return (
        <>

         <div className="upcoming-collapse pt-6">
            <div className="collapse bg-base-200 collapse-child">
               <input type="checkbox" id="today-collapse" className="peer" />
               <label htmlFor="today-collapse" className="collapse-title text-xl font-medium">
                  Today (date)
               </label>
               <div className="collapse-content"> 
                  <p>hello</p>
               </div>
            </div>
         </div>

         <div className="upcoming-collapse">
            <div className="collapse bg-base-200 collapse-child">
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
            <div className="collapse bg-base-200 collapse-child">
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
            <div className="collapse bg-base-200 collapse-child">
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