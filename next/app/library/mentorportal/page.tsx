
"use client"
import { useState, useEffect } from "react";
export default function MentorPortal() {

    const [statistics, setStatistics] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        fetch("/api/library/statistics").then(res => res.json()).then(data => {
            setStatistics(data);
        }).catch(e => {
            console.error("Error fetching statistics:", e);
        })
    }, []);

    return (
        <>
            <div className="w-[80%] [&_h2]:py-4 [&_p]:py-1 [&_details]:py-2 ">
                <h2 className="italic"><img src="/library-icons/information.png" className="inline mr-2" />Welcome to the Mentor Portal!</h2>
                <p><img src="/library-icons/pinsmall.png" className="inline mr-2" /><b className="text-orange-700">Pinned:</b> Checking out books has not been authorized yet! Please refer to the Mentor Committee Head or Primary Officers for an update on this policy</p>

                <p>Welcome to the Mentor Portal! Here, you can view the current textbook circulation, current exam inventory, and more!</p>

                <p>Textbooks Registered: <b>{statistics.totalTextbooks}</b></p>
                <p>Total Textbooks: <b>{statistics.totalBooks}</b></p>
                <p>Textbooks Checked Out: <b>{statistics.checkedOutBooks}</b></p>

                <span className="[&_a]:ml-[4px]">Quick Links:
                    <a href="/library/mentorportal/editbook" className="underline text-blue-500">Edit Book</a>
                    <a href="/library/mentorportal/addbook" className="underline text-blue-500">Add Book</a>
                </span>

                <hr className="my-3"/>
                <p className="italic font-serif text-[15px] w-[100%] text-right">Last Updated: Feburary 6, 2026</p>
            </div>
        </>
    );
}