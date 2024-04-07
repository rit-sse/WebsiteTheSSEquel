"use client"
import MentorGrid from './MentorGrid';
import MentorInfo from './MentorInfo';
import { useState, useEffect } from 'react';
import './page.css'

export interface ScheduleProps {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
}

export interface MentorGridProps {
    schedule: ScheduleProps[];
}

const MentorPage = () => {
    const [schedule, setSchedule] = useState(); 

    useEffect(() => {
        (async() => {
            const response = await fetch("http://localhost:3000/api/mentorSchedule");
            const scheduleData = await response.json();
            setSchedule(scheduleData.map((item: {monday: string[], tuesday: string[], wednesday: string[], thursday: string[], friday: string[]}) => ({
                monday: item.monday,
                tuesday: item.tuesday,
                wednesday: item.wednesday,
                thursday: item.thursday,
                friday: item.friday,
            })));

            console.log(scheduleData);

        })();


    }, [])
    return (
        <>
            <div className='flex'>
                <MentorInfo></MentorInfo>
                {/* <MentorGrid schedule={schedule}></MentorGrid>  */}
                {/* I am still stunted on this bruh */}
            </div>
        </>
    )
}

export default MentorPage;