'use client'

import React, { useState } from 'react';
import GoLink from './GoLink';
import { GoLinksContainerProps } from "@/app/go/page";

const SearchContainer: React.FC<GoLinksContainerProps> = ({goLinkData}) => {
    const [filter, setFilter] = useState<string>("") 
    
    const filteredGoLinkData = goLinkData.filter((data) => {
        data.goUrl.toLowerCase().includes(filter.toLowerCase())
    })

    const goLinkList = filteredGoLinkData.map((data, index) => (
        <GoLink
            key={index}
            {...data}
        />
    ));

    return (
        <div className="w-7/12">
            <input type="text" placeholder="Type here" className="input input-bordered w-full my-5" onChange={(event) => setFilter(event.target.value)}/>
        </div>
    )
};


export default SearchContainer;