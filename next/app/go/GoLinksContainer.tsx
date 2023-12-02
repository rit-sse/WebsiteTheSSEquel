'use client'

import React, { useState } from 'react';
import GoLink from './GoLink';
import { GoLinksContainerProps } from "@/app/go/page";
import { filterGoLinks } from '@/lib/filter';

const GoLinksContainer: React.FC<GoLinksContainerProps> = ({ goLinkData }) => {
    const [filter, setFilter] = useState<string>("")
    const [goLinkList, setGoLinkList] = useState<React.JSX.Element[]>(goLinkData.map((data, index) => (
        <GoLink
            key={index}
            {...data}
        />
    )));



    const setDisplay = (givenFilter: string) => {
        if (givenFilter === "") {
            setGoLinkList(goLinkData.map((data, index) => (
                <GoLink
                    key={index}
                    {...data}
                />
            )))
        }
        else {
            console.log("data: " + goLinkData)
            console.log("filter: " + givenFilter)
            const filteredGoLinkData = filterGoLinks(givenFilter, goLinkData)
            console.log(filteredGoLinkData)
            
            setGoLinkList(filteredGoLinkData.map((data, index) => (
                <GoLink
                    key={index}
                    {...data}
                />
            )))
        }
        // const filteredGoLinkData = goLinkData.filter((data) => {        
        //     data.goUrl.toLowerCase().includes(filter.toLowerCase())
        // })
    }

    // const goLinkList = filteredGoLinkData.map((data, index) => (
    //     <GoLink
    //         key={index}
    //         {...data}
    //     />
    // ));


    // const goLinkList = goLinkData.map((data, index) => (
    //     <GoLink
    //         key={index}
    //         {...data}
    //     />
    // ));

    return (
        <div>
            <div className="w-full">
                <input type="text" placeholder="Type here" className="input input-bordered w-full my-5" onChange={(event) => setDisplay(event.target.value)} />
            </div>
            <div className="
                grid
                grid-cols-1
                sm:grid-cols-1
                md:grid-cols-2
                lg:grid-cols-2
                gap-4
                p-4
            ">
                {goLinkList}
            </div>
        </div>
    )
};

export default GoLinksContainer;