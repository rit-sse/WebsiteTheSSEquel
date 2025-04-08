'use client';
import { useEffect, useState } from 'react';
import React from "react";
import TimeCard from "./mentorTimeCard";
import { getData, setSchedule, setSkills, getMentorClasses, sortMentorMajor, setSelectedMentor } from "./mentor";
import { Mentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
import { AllMentorTime } from "./timeSlot";
//board to represent mentors and their times/schedules
//0 = monday,1=tuesday,2=wednesday,3=thursday,4=friday
//0-8 is the times from 10am to 6pm
const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],major: "",id:0,skills:[],selected:false}
const emptyTimeslot:MentorTimeSlot = {mentor1: emptyMentor, mentor2:emptyMentor, isdualTimeSlot:false,selectedMentorName:"No Mentor"}
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
                var slot:MentorTimeSlot = ({mentor1: mentor[i],mentor2:emptyMentor,isdualTimeSlot:false,selectedMentorName:"No Mentor"})
                board[day][time] = slot
            } else {
                board[day][time].mentor2 = mentor[i]
                board[day][time].isdualTimeSlot = true
            }
        }
    }
    return board;
}
const useMentorSelector = (mentorList: Mentors[], mentorName:String) => {
    const [selectedMentor, setSelectedMentor] = useState<Mentors | null>(null);
    useEffect(() => { 
      const foundMentor = mentorList.find(m => m.name === mentorName);
      if (foundMentor) {
        setSelectedMentor(foundMentor);
      }
    }, [mentorName, mentorList]);
  
    return selectedMentor;
};

const MentorBoard =()=>{
  //All the data that we will be using to fill th mentor board
    const [mentors, setMentors] = useState<Mentors[]>([]);
    const [board, setBoard] = useState<MentorTimeSlot[][]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [skills, setSkillsList] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState('');
    const selectedMentor = useMentorSelector(mentors, selectedName);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedName(e.target.value);
    };

    useEffect(() => {
        const fetchData = async () => {
            const mentorList: Mentors[] = [];
            const classList: string[] = [];
            const skillList: string[] = [];
            await getData(mentorList);
            await setSchedule(mentorList);
            await setSkills(skillList, mentorList);
            await getMentorClasses(classList, mentorList);
            const boardData = fillboard(mentorList);

            // Update state after processing
            setMentors(mentorList);
            setBoard(boardData);
            setClasses(classList);
            setSkillsList(skillList);
        };
        fetchData();
    }, []);
    
    return(
        <div className="float-right">
            <div className="float-left">
                <div className="w-30 h-24">

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
                        <select onChange={(e) => handleSelectChange(e)}className="bg-[#0B1C2C] text-white text-sm w-full px-1 py-0.5 leading-tight focus:outline-none rounded-xl">
                            <option className="text-black">Mentors</option>
                            {mentors.map((mentor)=>(
                            <option value={mentor.name} className="text-black">{mentor.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center px-4 py-2 rounded-full text-white min-w-[175px]">
                        <select className="bg-[#0B1C2C] text-white text-sm w-full px-1 py-0.5 leading-tight focus:outline-none rounded-xl">
                            <option className="text-black">Classes</option>
                            {classes.map((mentor)=>(
                              <option className="text-black">{mentor}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center px-4 py-2 rounded-full text-white min-w-[175px]">
                        <select className="bg-[#0B1C2C] text-white text-sm w-full px-1 py-0.5 leading-tight focus:outline-none rounded-xl">
                            <option className="text-black">Skills</option>
                            {skills.map((skill)=>(
                              <option className="text-black">{skill}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {board.map((row,rowIndex)=>(
                    <div key={rowIndex} className="inline-block">
                        <div className="text-center text-blue-300 font-semibold p-2 border border-white">
                            {days[rowIndex]}
                        </div>  
                        {row.map((value) => (
                            <TimeCard mentor1={value.mentor1} mentor2={value.mentor2} isdualTimeSlot={value.isdualTimeSlot} selectedMentorName={selectedMentor?.name ?? "No Mentor"}/>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MentorBoard