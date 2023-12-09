'use client'

import React, { useState } from 'react';
import GoLink from './GoLink';
import { GoLinksContainerProps } from "@/app/go/page";
import { filterGoLinks } from '@/lib/filter';

const GoLinksContainer: React.FC<GoLinksContainerProps> = ({ goLinkData }) => {
    const pinnedGoLinks = goLinkData
        .filter(data => data.pinned === true)
        .map((data, index) => (
            <GoLink
            key={index}
            {...data}
            />
        ));

    const unpinnedGoLinks = goLinkData
        .filter(data => !data.pinned)
        .map((data, index) => (
            <GoLink
            key={index}
            {...data}
            />
        ));

    const [goLinkList, setGoLinkList] = useState<React.JSX.Element[]>([...pinnedGoLinks, ...unpinnedGoLinks]);

    const setDisplay = (givenFilter: string) => {
        if (givenFilter === "") {
            setGoLinkList([...pinnedGoLinks, ...unpinnedGoLinks])
        }
        else {
            const filteredGoLinkData = filterGoLinks(givenFilter, goLinkData)
            console.log(filteredGoLinkData)

            setGoLinkList(filteredGoLinkData.map((data, index) => (
                <GoLink
                    key={index}
                    {...data}
                />
            )))
        }
    }

    return (
        <div className="w-9/12">
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