import { FC, useEffect, useState } from "react";
import GoLinksTable from "./GoLinksTable";

type GoLinkStructure = { 
    id: number; 
    golink: string;
    url: string; 
    description: string; 
    createdAt: string; 
    updatedAt: string; 
    isPinned: boolean; 
    isPublic: boolean; 
};

const GoLinksManagementPage: FC = () => {
    const [isOfficer, setIsOfficer] = useState<boolean>(false);
    const [golinkModalVisible, setGoLinkModalVisible] = useState<boolean>(false);

    const [goLinks, setGoLinks] = useState<Array<GoLinkStructure>>([]);

    useEffect(() => {
        // Fetch the user's Go Links.
        fetch("/api/goLinks")
            .then(resp => resp.json())
            .then(data => {
                setGoLinks(data);
            });
    }, []);

    useEffect(() => {
        // Fetch the user's ID.
        fetch("/api/authLevel")
            .then(resp => resp.json())
            .then(resp => {
                console.log(resp)
                setIsOfficer(resp["isOfficer"]);
          })
    }, [])
    return (
        <div className='px-[10px]'>
            <h3>Go Links</h3>
            {isOfficer ? <button className="bg-primary text-base-100 px-[25px] py-[10px] rounded-lg" onClick={() => setGoLinkModalVisible(true)}>Add Go Link</button> : undefined}
            <GoLinksTable isOfficer={isOfficer} goLinks={goLinks} />
        </div>
    );
};

export default GoLinksManagementPage;