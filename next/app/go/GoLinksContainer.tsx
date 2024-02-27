'use client'

import React, { useEffect, useState } from 'react';
import GoLink, { GoLinkProps } from './GoLink';
import { GoLinksContainerProps } from "@/app/go/page";
import { filterGoLinks } from '@/lib/filter';
import {GoLinkButton} from '@/app/go/MakeNewGoLink'

const GoLinksContainer: React.FC<GoLinksContainerProps> = ({ goLinkData }) => {
    const pinnedGoLinks = goLinkData
    .filter(data => data.pinned === true)
    .map((data, index) => (
        <GoLink
            key={`pinned-${index}`}
            {...data}
        />
    ));

    const unpinnedGoLinks = goLinkData
    .filter(data => !data.pinned)
    .map((data, index) => (
        <GoLink
            key={`unpinned-${index}`}
            {...data}
        />
    ));

    const [goLinkList, setGoLinkList] = useState<React.JSX.Element[]>([...pinnedGoLinks, ...unpinnedGoLinks]);
    const setDisplay = (givenFilter: string) => {
        console.log("FART FART")
        if (givenFilter === "") {
            setGoLinkList([...pinnedGoLinks, ...unpinnedGoLinks])
        }
        else {
            const filteredGoLinkData = filterGoLinks(givenFilter, goLinkData)

            setGoLinkList(filteredGoLinkData.map((data, index) => (
                <GoLink
                    key={index}
                    {...data}
                />
            )))
        }
        console.log("List: " + goLinkList)
    }

    if (goLinkData.length === 0) {
        return (
            <div className="w-9/12">
                <div className="text-center flex flex-col items-center w-full">
                    <h1
                    className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                    >
                    Go Links
                    </h1>
    
                    <p className="text-center mx-auto mt-4 text-xl/relaxed">
                    GoLinks are a type of URL shortcut that allow you to access the SSE's frequently used 
                    external websites or resources. Important or relevant golinks are marked with a gold star.
                    </p>
                </div>
                <div className='text-center my-10'>Loading...</div>
            </div>
        )
    }
    else{
        return (
            <div className="w-9/12">
                <div className="text-center flex flex-col items-center w-full">
                    <h1
                    className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                    >
                    Go Links
                    </h1>
    
                    <p className="text-center mx-auto mt-4 text-xl/relaxed">
                    GoLinks are a type of URL shortcut that allow you to access the SSE's frequently used 
                    external websites or resources. Important or relevant golinks are marked with a gold star.
                    </p>
                </div>
    
                <div className="w-full mt-4">
                    <input type="text" placeholder="Search golinks, etc..." className="input input-bordered w-full my-5" onChange={(event) => setDisplay(event.target.value)} />
                </div>
                <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-1
                    md:grid-cols-2
                    lg:grid-cols-2
                    gap-4
                    md:p-4
                ">
                    <GoLinkButton/>
                    {goLinkList}
                </div>
            </div>
        )
    }
};

export default GoLinksContainer;