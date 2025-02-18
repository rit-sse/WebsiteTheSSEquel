import React from "react";
import { Mentors,mockmentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";

const TimeCard = ({mentor1,mentor2,isdualTimeSlot}:MentorTimeSlot) =>{
    if(isdualTimeSlot){
        return(
            <div className="w-30 h-12">
                <div style={{backgroundColor: mentor1.color}}>
                    {mentor1.name}
                </div>
                <div style={{backgroundColor: mentor2.color}}>
                    {mentor2.name}
                </div>
            </div>
        )
    } else{
        return(
            <div className="w-30 h-12">
                <div style={{backgroundColor: mentor1.color}}>
                    {mentor1.name}
                </div>
            </div>
        )
    }
}

export default TimeCard