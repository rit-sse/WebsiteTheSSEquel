import React from "react";
import { Mentors,mockmentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
const TimeCard = ({mentor1,mentor2,isdualTimeSlot}:MentorTimeSlot) =>{
    if(isdualTimeSlot){
        return(
            <div className="w-30 h-12 border-black border-x-[1px] border-y-[1px]">
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
            <div style={{display: 'grid', placeItems: 'center'}} className="w-30 h-12 border-black border-x-[1px] border-y-[1px]">
                <div style={{}}>
                    {mentor1.name}
                </div>
            </div>
        )
    }
}

export default TimeCard