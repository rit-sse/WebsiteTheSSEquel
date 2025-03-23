import React from "react";
import { Mentors,mockmentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
const TimeCard = ({mentor1,mentor2,isdualTimeSlot}:MentorTimeSlot) =>{
    if(isdualTimeSlot){
        return(
            <div className="w-30 h-12 border border-white p-2 flex flex-col items-center justify-center gap-2 bg-[#0B1C2C]">
                <div style={{display: 'grid', placeItems: 'center'}}>
                    {mentor1.name}
                </div>
                <div style={{display: 'grid', placeItems: 'center'}}>
                    {mentor2.name}
                </div>
            </div>
        )
    } else{
        return(
            <div style={{display: 'grid', placeItems: 'center'}} className="w-30 h-12 border border-white p-2 flex flex-col items-center justify-center gap-2 bg-[#0B1C2C]">
                <div style={{}}>
                    {mentor1.name}
                </div>
            </div>
        )
    }
}

export default TimeCard