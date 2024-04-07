"use client"
import MentorGrid from './MentorGrid';
import MentorInfo from './MentorInfo';
import { useState, useEffect } from 'react';
import './page.css'

const MentorPage = () => {
    const [schedule, setSchedule] = useState(); 

    useEffect(() => {
        (async() => {
            const response = await fetch("http://localhost:3000/api/mentorSchedule");
            const scheduleData = await response.json();
            setSchedule(scheduleData);

            console.log(scheduleData);

        })();


    }, [])
    return (
        <>
            <div className='flex'>
                <MentorInfo></MentorInfo>
                <MentorGrid></MentorGrid>
            </div>
        </>
    )
}

export default MentorPage;