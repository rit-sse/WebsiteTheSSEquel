import React from 'react';
import GoLink from './GoLink';

interface GoLinksContainerProps {
    goLinkData: { goUrl: string; url: string; description: string; pinned: boolean }[];
}

const GoLinksContainer: React.FC<GoLinksContainerProps> = ({ goLinkData }) => {
    const goLinkList = goLinkData.map((data, index) => (
        <GoLink
            key={index}
            {...data}
            canEdit={false}
        />
    ));
    
    return (
        <div>
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
}

export default GoLinksContainer;