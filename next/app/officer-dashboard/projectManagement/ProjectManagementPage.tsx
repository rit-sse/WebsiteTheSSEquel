"use client";
import AddProjectModal from "@/app/projects/AddProjectModal";
import { useState, useEffect } from "react";
import AddGoLinkModal from "../goLinksManagement/AddGoLinkModal";
import ProjectTable from "./ProjectTable";

const ProjectManagementPage: React.FC = () => {
    const [isOfficer, setIsOfficer] = useState<boolean>(false);
    const [golinkModalVisible, setGoLinkModalVisible] = useState<boolean>(false);

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
          <AddGoLinkModal visible={golinkModalVisible} modalVisiblecallback={setGoLinkModalVisible} />
          <h2>Website Management</h2>
          <h3>Projects</h3>
          <ProjectTable isOfficer={isOfficer} />
        </div>
    );
};

export default ProjectManagementPage;