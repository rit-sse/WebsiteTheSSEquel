import { FC, useEffect, useState } from "react";
import GoLinksTable from "./GoLinksTable";
import GoLinkModal from "./GoLinkModal";

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

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editData, setEditData] = useState<GoLinkStructure | undefined>(undefined);

    function dataFetch() {
        fetch("/api/golinks/officer")
            .then(resp => resp.json())
            .then(officerData => {
                fetch("/api/golinks/public")
                    .then(resp => resp.json())
                    .then(publicData => {
                        setGoLinks([...officerData, ...publicData]);
                    });
            });
    }

    useEffect(() => {
        dataFetch();
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

    function goLinkAdd(isEditing: boolean = false, editData: GoLinkStructure | undefined = undefined) {
        setIsEditing(isEditing);
        setEditData(editData);
        setGoLinkModalVisible(true);
    }

    
    return (
        <div className='px-[10px]'>
            <h2>Go Links Management</h2>
            <h3>Go Links</h3>
            {isOfficer ? <button className="bg-primary text-base-100 px-[25px] py-[10px] rounded-lg" onClick={() => { goLinkAdd(false, undefined); setGoLinkModalVisible(true); }}>Add Go Link</button> : undefined}
            <GoLinksTable isOfficer={isOfficer} goLinks={goLinks} goEdit={goLinkAdd}/>
            <GoLinkModal visible={golinkModalVisible} modalVisiblecallback={setGoLinkModalVisible} isEditing={isEditing} editData={editData} resetData={dataFetch} />
        </div>
    );
};

export default GoLinksManagementPage;