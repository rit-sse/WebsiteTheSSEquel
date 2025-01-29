import React, {useState} from "react";
import { Project } from "./projects";

interface ProjectModalInterface {
    enabled: boolean,
    setEnabled: Function,
    project:Project
}

const ProjectModal = ({enabled, setEnabled, project}: ProjectModalInterface ) => {
    let projectBackground = project.logo == "" ? "images/SSEProjectPlaceholder.png" : project.logo

    let unload = () => {
        setEnabled(false)
    }

    return(
        <div >
            {
                enabled ?
                <div className="fixed top-[0px] left-[0px] w-[100%] h-[100%] z-[100]
                                flex items-center justify-center"
                >
                    <div className="absolute top-0 left-0 w-[100%] h-[100%] backdrop-blur-[15px] bg-black/25" onClick={unload}>
                        
                    </div>
                    <div className="relative w-[500px] bg-base-100 rounded-xl overflow-hidden
                                    display flex flex-col items-center p-[25px]">
                        <div className="absolute top-[0px] left-[0px] w-[100%] h-[12px] bg-[#6289AC]"> 
                        </div>
                        <p className="w-[100%] text-2xl font-bold m-[2px]">{project.title}</p>
                        <div className="relative w-[100%] h-[250px] overflow-hidden rounded-xl mt-[5px]">
                            <img src={projectBackground} className="absolute top-[0px] left-[0px] w-[100%] h-[100%] rounded-xl object-cover"/>
                            <div className="absolute top-[0px] left-[0px] w-[100%] h-[100%] backdrop-blur-[15px] bg-black/25 rounded-xl"></div>
                            <img src={projectBackground} className="absolute top-[0px] left-[0px] w-[100%] h-[100%] rounded-xl object-contain"/>
                        </div>
                        <p className="w-[100%] text-xl mt-[8px]"><span className="font-bold">Lead:</span> {project.lead}</p>
                        <p className="w-[100%] text-xl m-[0px]"><span className="font-bold">Contact:</span> {project.contact}</p>
                        <p className="w-[100%] leading-8">{project.description}</p>

                    </div>
                </div> : undefined
            }
        </div>
    )
}

export default ProjectModal;