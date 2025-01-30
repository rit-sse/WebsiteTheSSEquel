import React, {useState} from "react";
import { Project } from "./projects";
import ProjectLink from "./ProjectLink";

// This is used to structure the arguments for the Project Modal
interface ProjectModalInterface {
    enabled: boolean,
    setEnabled: Function,
    project:Project
}

const ProjectModal = ({enabled, setEnabled, project}: ProjectModalInterface ) => {
    // If the project.logo is empty, we are repalcing it with the placeholder image
    let projectBackground = project.logo == "" ? "images/SSEProjectPlaceholder.png" : project.logo

    // This is quite the deceiving name. This just sets the modal visiblity to false. setEnabled a funcrtion passed through as setModalEnabled in ProjectModal.tsx
    let unload = () => {
        setEnabled(false)
    }

    return(
        <div >
            {
                enabled ?
                // The fixed Modal container.
                <div className="fixed top-[0px] left-[0px] w-[100%] h-[100%] z-[100]
                                flex items-center justify-center">
                    {/* The black backdrop. */}
                    <div className="absolute top-0 left-0 w-[100%] h-[100%] backdrop-blur-[15px] bg-black/25" onClick={unload}>
                        
                    </div>
                    {/* Actual Modal Container */}
                    <div className="relative w-[900px] h-[600px] z-[50] bg-base-100 rounded-l overflow-hidden
                                    flex justify-center items-center">
                        {/* This is the top accent bar. */}
                        <div className="absolute top-0 left-o w-[100%] h-[15px] bg-base-200 rounded-l">
                        </div>
                        {/* Actual Modal Content */}
                        <div className="flex w-[90%] h-[90%] flex-col">
                            {/* This is the "top bar" of the Modal. Contains the project title text and the exit button. */}
                            <div className="flex items-center justify-between">
                                {/* Project Title */}
                                <h3 className="text-primar h-[10%]y">Project 1</h3>
                                {/* Exit Button */}
                                <svg width="30" height="30" viewBox="0 0 35 36" className="fill-primary cursor-pointer" onClick={unload}  xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_23_61)">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9799 19.5201V32.4659H13.8773V23.1093L1.48865 35.5L0 34.0114L12.3907 21.6227H3.0341V19.5201H15.9799ZM33.5124 0.5L34.9989 1.98655L22.6103 14.3773H31.967V16.4799H19.0211V3.53408H21.1238V12.8886L33.5124 0.5Z" />
                                    </g>
                                </svg>
                            </div>
                            {/* Actual content of the Modal */}
                            <div className="flex h-[90%] w-[100%] items-center justify-center">
                                {/* Image of the project */}
                                <div className="relative h-full w-full overflow-hidden rounded-l">
                                    {/* This is split into 3 parts.
                                        1. The backdrop image (this is covered to fill any spots)
                                        2. Black backdrop with a blur.
                                        3. Actual image that fits within the container.
                                        */}
                                    <img className="absolute w-full h-full object-cover rounded-l" src={projectBackground}/>
                                    <div className="absolute top-0 left-0 w-[100%] h-[100%] backdrop-blur-[15px] bg-black/25 rounded-l"> </div>
                                    <img className="absolute w-full h-full object-contain z-20 rounded-l" src={projectBackground}/>
                                </div>
                                {/*  Text Container */}
                                <div className="w-full h-full p-[0px] pl-[20px]">
                                    {/* Lead */}
                                    <p className="text-xl"><span className="font-bold">Lead:</span> {project.lead}</p>
                                    {/* Contact */}
                                    <p className="text-xl"><span className="font-bold">Contact:</span> {project.contact}</p>
                                    {/* Description */}
                                    <p className="text-lg mb-[10px]">{project.description}</p>
                                    {/* Email */}
                                    <ProjectLink url={"mailto:" + project.contact} text="Email"/>
                                    {/* Mapping all the project.links (Project[]) into a ProjectLink. */}
                                    {project.links.map((linkInfo, key) => (
                                        <ProjectLink key={key} text={linkInfo.text} url={linkInfo.url} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div> : undefined
            }
        </div>
    )
}

export default ProjectModal;