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
            <p>search</p>
        </div>
    )
};


export default SearchContainer;