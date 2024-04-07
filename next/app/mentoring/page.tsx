"use client"
import MentorGrid from './MentorGrid';
import MentorInfo from './MentorInfo';
import { useState, useEffect } from 'react';
import './page.css'

type DaySchedule = {
    [hour: string]: string[];
};

type ScheduleData = {
    [day: string]: DaySchedule;
};

export interface MentorGridProps {
    schedule: ScheduleData;
}

const MentorPage = () => {
    const [schedule, setSchedule] = useState<ScheduleData>({}); 

    useEffect(() => {
        (async() => {
            const response = await fetch("http://localhost:3000/api/mentorSchedule");
            const scheduleData = await response.json();
            console.log(scheduleData);
            setSchedule(scheduleData);
        })();


    }, [])
    return (
        <>
            <div className='flex'>
                <MentorInfo></MentorInfo>
                <MentorGrid schedule={schedule}></MentorGrid> 
            </div>
        </>
    )
}

export default MentorPage;