import { useState } from "react";
import React from "react";
import TimeCard from "./mentorTimeCard";
import { mockmentors } from "./mentor";
import MentorBoard from "./mentorBoard";

export default function mentoring() {
    return(<>
        <div className="flex flex-col items-center w-full h-screen max-w-screen-xl">
            <MentorBoard/>
        </div>
    </>)
}