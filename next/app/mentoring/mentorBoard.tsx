import { useState } from "react";
import React from "react";
import TimeCard from "./mentorTimeCard";
import { mockmentors } from "./mentor";
import { Mentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";

//board to represent mentors and their times/schedules
//0 = monday,1=tuesday,2=wednesday,3=thursday,4=friday
//0-8 is the times from 10am to 6pm
const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],color:'grey'}
const emptyTimeslot:MentorTimeSlot = {mentor1: emptyMentor, mentor2:emptyMentor, isdualTimeSlot:false}
//current representation for an empty timeslot
const board: MentorTimeSlot[][] = []

function fillboard(mentor:Mentors[]){
    for(let i = 1; i<= 5; i++){
        board.push([emptyTimeslot,emptyTimeslot,emptyTimeslot,emptyTimeslot,emptyTimeslot,emptyTimeslot,emptyTimeslot,emptyTimeslot])
    }
    for(let i = 0; i < mentor.length; i++){
        for(let k = 0; k < mentor[i].time.length; k++){
            var day:number = mentor[i].time[k].day
            var time:number = mentor[i].time[k].timeslot
            if(board[day][time].mentor1 == emptyMentor){
                var slot:MentorTimeSlot = ({mentor1: mentor[i],mentor2:emptyMentor,isdualTimeSlot:false})
                board[day][time] = slot
            } else {
                board[day][time].mentor2 = mentor[i]
                board[day][time].isdualTimeSlot = true
            }
        }
    }
}
const MentorBoard = ()=>{
    fillboard(mockmentors)
    return(
        <div className="board">
            {board.map((row,rowIndex)=>(
                <div key={rowIndex} className="inline-block">
                    {row.map((value) => (
                        <TimeCard mentor1={value.mentor1} mentor2={value.mentor2} isdualTimeSlot={value.isdualTimeSlot}/>
                    ))}
                </div>
            ))}
        </div>
    )
}

export default MentorBoard