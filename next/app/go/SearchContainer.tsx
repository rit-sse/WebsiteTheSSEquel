import React from 'react';
import GoLink from './GoLink';
import { GoLinksContainerProps } from "@/app/go/page";

const SearchContainer: React.FC<GoLinksContainerProps> = ({goLinkData}) => {
    const goLinkList = goLinkData.map((data, index) => (
        <GoLink
            key={index}
            {...data}
        />
    ));

    return (
        <div>
            <input type="text" placeholder="Type here" className="input input-bordered w-full max-w-xs" />
        </div>
    )
};


export default SearchContainer;