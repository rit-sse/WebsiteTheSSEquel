import { useState } from "react";
import React from "react";
import TimeCard from "./mentorTimeCard";
import { mockmentors } from "./mentor";
import MentorBoard from "./mentorBoard";
import MentorList from "./mentorList";

export default function mentoring() {
    return(<>
        <div className="">
            <MentorList/>
            <MentorBoard/>
        </div>
    </>)
}