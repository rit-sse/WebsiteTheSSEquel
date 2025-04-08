import React from "react";
import { MentorTimeSlot } from "./mentorTimeslot";
const TimeCard = ({mentor1,mentor2,isdualTimeSlot,selectedMentorName}:MentorTimeSlot) =>{
    var isSelected1 = false
    var isSelected2 = false
    if(selectedMentorName == mentor1.name){
        isSelected1 = true;
    } else if(selectedMentorName == mentor2.name){
        isSelected2 = true;
    }
    if(isdualTimeSlot){
        return(
            <div className="w-30 h-12 border border-gray-500 px-2 py-1 flex flex-col items-center justify-center gap-1 bg-[#0B1C2C]">
                <div className={`text-center ${isSelected1 ? "text-blue-400" : "text-white"}`}>{mentor1.name}</div>
                <div className={`text-center ${isSelected2? "text-blue-400" : "text-white"}`}>{mentor2.name}</div>
            </div>
        )
    } else{
        return(
            <div className="w-30 h-12 border border-gray-500 px-2 py-1 flex flex-col items-center justify-center gap-1 bg-[#0B1C2C]">
                <div className={`text-center ${isSelected1? "text-blue-400" : "text-white"}`}>{mentor1.name}</div>
            </div>
        )
    }
}

export default TimeCard