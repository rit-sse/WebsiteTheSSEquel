import { useState } from "react";
import React from "react";
import TimeCard from "./mentorTimeCard";
import { getData, mockmentors, sortMentorMajor } from "./mentor";
import { Mentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
import { AllMentorTime } from "./timeSlot";
import { time } from "console";

const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],major: ""}

const MentorList = async () =>{
    var mentorMajors:Mentors[][] = [];
    var mentors:Mentors[] = []
    await getData(mentors)
    mentorMajors = sortMentorMajor(mentors)
    return(
        <div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left">
            <h2 className="text-2xl font-bold text-center mb-4">Mentors</h2>
            {mentorMajors.map((major)=>(
            <div className="mb-4">
                <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2">{major[0].major}</h3>
                <div className="grid grid-cols-2 gap-x-6">
                    {major.map((mentor)=>(
                        <span>
                            {mentor.name}
                        </span>
                    ))}
                </div>
            </div>))}
        </div>
    )
}

export default MentorList