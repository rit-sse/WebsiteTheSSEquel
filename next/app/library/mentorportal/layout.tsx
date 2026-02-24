"use client"

import { useState, useEffect, type ReactElement } from "react";
import Image from "next/image";

const TopbarIcon = (props: { iconUrl: string}): ReactElement => {
    return(
        <Image src={props.iconUrl} alt="Icon" className="w-4 h-4 inline" width={16} height={16} />
    )
}

export default function LibraryLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const [authLevel, setAuthLevel] = useState<{ [key: string]: any }>({ isOfficer: false, isMentor: false });
    
    useEffect(() => {
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/authLevel").then(resp => resp.json()).then(authData => { setAuthLevel(authData); });
    }, []);

    return (
        <div className={`flex flex-col items-center bg-white min-h-screen w-screen z-[20] text-black`}>

            <div className=" w-full">
                <h1 className="text-3xl font-semibold mb-4 text-white px-5 py-4 from-blue-950 to-blue-800 bg-gradient-to-l">SSE Webb Library System</h1>
                <div className="[&_a]:mr-3 flex flex-row justify-between bg-white px-5 pb-4">
                    <div>
                        <a href="/library/mentorportal" className="underline text-blue-500"><TopbarIcon iconUrl="/library-icons/world.png" /> Dashboard</a>
                        <a href="/library/mentorportal/editbook" className="underline text-blue-500"><TopbarIcon iconUrl="/library-icons/pencil.png" /> Edit Book</a>
                        <a href="/library/mentorportal/addbook" className="underline text-blue-500"><TopbarIcon iconUrl="/library-icons/book.png" /> Add Book</a>
                        <a href="/library/mentorportal/circulation" className="underline text-blue-500"><TopbarIcon iconUrl="/library-icons/database.png" /> Circulation</a>
                        <a href="/library/mentorportal/category" className="underline text-blue-500"><TopbarIcon iconUrl="/library-icons/category.png" /> Categories</a>
                    
                    </div>
                    <a href="/library" className="underline text-blue-500">Back to Library</a>
                </div>

            </div>
            {children}
        </div>
    );
}