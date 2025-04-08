'use client';
import React, { useEffect, useState } from "react";
import { getData, getMentorClasses, setSchedule, setSkills, sortMentorMajor } from "./mentor";
import { Mentors } from "./mentor";

const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],major: "",id:0,skills:[],selected:false}
const days:string[] =["Monday","Tuesday","Wednesday","Thursday","Friday"]
const MentorList = () =>{
    const [selectedMentor, setSelectedMentor] = useState<Mentors>(emptyMentor);
    const handleMentorClick = (mentor:Mentors) => {
        setSelectedMentor(mentor);
      };
    var mentorMajors:Mentors[][] = [];
    const [mentors, setMentors] = useState<Mentors[]>([]);
    useEffect(() => {
        const fetchMentors = async () => {
            const mentorList: Mentors[] = [];
            const classList: string[] = [];
            const skillList: string[] = [];
            await getData(mentorList);
            await setSchedule(mentorList);
            await setSkills(skillList, mentorList);
            await getMentorClasses(classList, mentorList);
            setMentors(mentorList);
        };
        fetchMentors();
    }, []);
    mentorMajors = sortMentorMajor(mentors)
    if(selectedMentor.name== "Time Unfilled"){
        return(
            <div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left">
                <h2 className="text-2xl font-bold text-center mb-4">Mentors</h2>
                {mentorMajors.map((major)=>(
                <div className="mb-4">
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2">{major[0].major}</h3>
                    <div className="grid grid-cols-2 gap-x-6">
                        {major.map((mentor)=>(
                            <span onClick={() => handleMentorClick(mentor)}>
                                {mentor.name}
                            </span>
                        ))}
                    </div>
                </div>))}
            </div>
        )
    } else{
        return(
            <div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left">
                <span onClick={() => handleMentorClick(emptyMentor)}>
                    Back
                </span>
                <h2 className="text-2xl font-bold text-center mb-4">{selectedMentor.name}</h2>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2 text-xl">Skills</h3>
                    <div className="text-sm flex space-y-2">
                        {selectedMentor.skills.map((skill)=>(
                            <span>{skill}</span>
                        ))}
                    </div>
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2 text-xl">Classes</h3>
                    <div className="text-sm flex space-y-2">
                        {selectedMentor.courses.map((coarse)=>(
                            <span>{coarse}</span>
                        ))}
                    </div>
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2 text-xl">Mentoring Times</h3>
                    {selectedMentor.time.map((time)=>(
                        <span>{days[time.day]}: {time.time}</span>
                    ))}
                </div>
            </div>
        )
    }
}

export default MentorList