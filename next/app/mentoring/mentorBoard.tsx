import { useState } from "react";
import React from "react";
import TimeCard from "./mentorTimeCard";
import { mockmentors } from "./mentor";
import { Mentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
import { AllMentorTime } from "./timeSlot";
import { time } from "console";
//board to represent mentors and their times/schedules
//0 = monday,1=tuesday,2=wednesday,3=thursday,4=friday
//0-8 is the times from 10am to 6pm
const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],major: ""}
const emptyTimeslot:MentorTimeSlot = {mentor1: emptyMentor, mentor2:emptyMentor, isdualTimeSlot:false}
//current representation for an empty timeslot
const days: string[] = ["Monday","Tuesday","Wednesday","Thursday","Friday"]

function fillboard(mentor:Mentors[]){
    var board: MentorTimeSlot[][] = []
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
    return board;
}
const MentorBoard = ()=>{
    var board: MentorTimeSlot[][] = []
    board = fillboard(mockmentors)
    return(
        <div className="float-right">
            <div className="float-left">
                <div className="w-30 h-12">
                    
                </div>
                <div className="">
                    {AllMentorTime[0].map((timem)=>(
                        <div className="w-30 h-12" style={{display: 'grid', placeItems: 'center'}}>
                            {timem.time}
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-[2px] border-white rounded-xl overflow-hidden float-right">
                <div className="flex gap-4 mb-4">
                    <div className="flex items-center px-4 py-2 rounded-full text-white min-w-[175px]">
                        <select className="bg-[#0B1C2C] text-white text-sm w-full px-1 py-0.5 leading-tight focus:outline-none rounded-xl">
                            <option className="text-black">Mentors</option>
                        </select>
                    </div>
                    <div className="flex items-center px-4 py-2 rounded-full text-white min-w-[175px]">
                        <select className="bg-[#0B1C2C] text-white text-sm w-full px-1 py-0.5 leading-tight focus:outline-none rounded-xl">
                            <option className="text-black">Mentors</option>
                        </select>
                    </div>
                    <div className="flex items-center px-4 py-2 rounded-full text-white min-w-[175px]">
                        <select className="bg-[#0B1C2C] text-white text-sm w-full px-1 py-0.5 leading-tight focus:outline-none rounded-xl">
                            <option className="text-black">Mentors</option>
                        </select>
                    </div>
                </div>
                {board.map((row,rowIndex)=>(
                    <div key={rowIndex} className="inline-block">
                        <div className="text-center text-blue-300 font-semibold p-2 border border-white">
                            {days[rowIndex]}
                        </div>  
                        {row.map((value) => (
                            <TimeCard mentor1={value.mentor1} mentor2={value.mentor2} isdualTimeSlot={value.isdualTimeSlot}/>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MentorBoard

function ScheduleGrid() {
  return (
    <div className="flex flex-col items-center p-4 bg-[#0B1C2C] min-h-screen text-white">
      {/* Dropdown header */}
      <div className="flex gap-4 mb-4">
        {/* <Dropdown label="Mentors" />
        
        <Dropdown label="Skills" />
        <Dropdown label="Classes" /> */}
      </div>

      {/* Schedule Table */}
      <div className="border-[2px] border-white rounded-xl overflow-hidden">
        <div className="grid grid-cols-5">
          {days.map((day) => (
            <div
              key={day}
              className="text-center text-blue-300 font-semibold p-2 border border-white"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid of TimeSlots */}
        {/* {timeSlots.map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5">
            {days.map((day, colIndex) => (
              <div
                key={colIndex}
                className="border border-white p-2 flex flex-col items-center justify-center gap-2 bg-[#0B1C2C]"
              >
                <
              </div>
            ))}
          </div>
        ))} */}
      </div>
    </div>
  );
}