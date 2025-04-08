'use client'
import React, { useEffect, useState } from "react";
import { getData, getMentorClasses, Mentors, setSchedule, setSkills } from "./mentor";
import MentorBoard from "./mentorBoard";
import MentorList from "./mentorList";
import { MentorTimeSlot } from "./mentorTimeslot";

const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],major: "",id:0,skills:[],selected:false}
const emptyTimeslot:MentorTimeSlot = {mentor1: emptyMentor, mentor2:emptyMentor, isdualTimeSlot:false,selectedMentorName:"No Mentor"}

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
export const useMentorSelector = (mentorList: Mentors[], mentorName:String) => {
    const [selectedMentor, setSelectedMentor] = useState<Mentors | null>(null);
    useEffect(() => { 
      const foundMentor = mentorList.find(m => m.name === mentorName);
      if (foundMentor) {
        setSelectedMentor(foundMentor);
      }
    }, [mentorName, mentorList]);
  
    return selectedMentor;
};

export default function mentoring() {
    const [board, setBoard] = useState<MentorTimeSlot[][]>([]);
    const [mentors, setMentors] = useState<Mentors[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [skills, setSkillsList] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState('');
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedName(e.target.value);
    };

    const handleMentorSelect = (mentorName:string) =>{
        setSelectedName(mentorName)
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
    return(<>
        <div className="flex space-x-16">
            <MentorList handleSelectChange={handleMentorSelect} board={board}/>
            <MentorBoard mentors={mentors} board={board} classes={classes} skills={skills} selectedName={selectedName} handleSelectChange={handleSelectChange}/>
        </div>
    </>)
}
