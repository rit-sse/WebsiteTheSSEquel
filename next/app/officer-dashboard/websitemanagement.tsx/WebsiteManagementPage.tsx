"use client";
import AddProjectModal from "@/app/projects/AddProjectModal";
import {useState, useEffect} from "react";

const WebsiteManagementPage: React.FC = () => {
    const [addProjectModalEnabled, setAddProjectModalEnabled] = useState<boolean>(false);
    const [isOfficer, setIsOfficer] = useState<boolean>(false);
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
            <h2>Website Management</h2>
            <h3>Projects</h3>
            { isOfficer ? 
        <button className="bg-primary text-base-100 px-[25px] py-[10px] rounded-lg" onClick={() => setAddProjectModalEnabled(true)}>Add Project</button>
        : undefined}
            <AddProjectModal enabled={addProjectModalEnabled} setEnabled={setAddProjectModalEnabled} reloadOnAdd={false} />
        </div>
    );
};

export default WebsiteManagementPage;