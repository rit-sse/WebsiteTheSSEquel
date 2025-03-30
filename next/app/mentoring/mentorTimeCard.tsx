import React from "react";
import { Mentors,mockmentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
const TimeCard = ({mentor1,mentor2,isdualTimeSlot}:MentorTimeSlot) =>{
    if(isdualTimeSlot){
        return(
            <div className="w-30 h-12 border border-white px-2 py-1 flex flex-col items-center justify-center gap-1 bg-[#0B1C2C]">
                <div className="text-center">{mentor1.name}</div>
                <div className="text-center">{mentor2.name}</div>
            </div>
        )
    } else{
        return(
            <div className="w-30 h-12 border border-white px-2 py-1 flex flex-col items-center justify-center gap-1 bg-[#0B1C2C]">
                {mentor1.name}
            </div>
        )
    }
}

export default TimeCard