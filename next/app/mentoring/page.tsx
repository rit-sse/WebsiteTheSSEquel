import React from "react";
import MentorBoard from "./mentorBoard";
import MentorList from "./mentorList";

export default function mentoring() {
    return(<>
        <div className="flex space-x-16">
            <MentorList/>
            <MentorBoard/>
        </div>
    </>)
}