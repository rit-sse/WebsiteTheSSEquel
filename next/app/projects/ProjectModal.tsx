import React, {useEffect, useState} from "react";
import { Project } from "./projects";
import ProjectLink from "./ProjectLink";
import ProjectModalInput from "./ProjectModalComponents/ProjectModalInput";
import ProjectModalDropdown from "./ProjectModalComponents/ProjectModalDropdown";

// This is used to structure the arguments for the Project Modal
interface ProjectModalInterface {
    enabled: boolean,
    setEnabled: Function,
    project:Project,
    isOfficer: boolean
}

// This is used to structure the user information
interface User {
    name: string,
    email: string
}

const ProjectModal = ({enabled, setEnabled, project, isOfficer}: ProjectModalInterface ) => {
    let [lead, setLead] = useState({
        name: "",
        email: ""
    });
    const [editMode, setEditMode] = useState(false);

    // If the project.logo is empty, we are replacing it with the placeholder image
    let projectBackground = (
        (project.projectImage == "") || 
        (project.projectImage == undefined) ||
        (project.projectImage == null)
    ) ? "images/SSEProjectPlaceholder.png" : project.projectImage

    // This is quite the deceiving name. This just sets the modal visiblity to false. setEnabled a function passed through as setModalEnabled in ProjectModal.tsx
    let unload = () => {
        setEnabled(false)
        setEditMode(false);
    }

    // Editing section
    let enableEditProjectModal = () => {
        setEditMode(true);
    }
    const [users, setUsers] = useState([]);
    const [projectTitle, setProjectTitle] = useState(project.title)
    const [leadid, setLeadID] = useState(project.leadid);
    const [desc, setDescription] = useState(project.description)
    const [repoLink, setRepoLink] = useState(project.repoLink)
    useEffect(() => {
        fetch("/api/user")
        .then(resp => resp.json())
        .then((resp) => {
            setUsers(resp)
        })
    }, [])

    useEffect(() => {
        fetch("/api/user/" + project.leadid)
        .then(resp => resp.json())
        .then((resp: User) => {
            console.log(resp)
            setLead({
                name: resp.name,
                email: resp.email
            })
        })
    }, [])

    let editProject = () => {
        let payload = {
            id: project.id,
            title: projectTitle,
            descrption: desc,
            repoLink: repoLink,
            contentURL: project.contentURL
        }

        fetch("/api/project", {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            unload()
            location.reload()
        })

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
                    <div className="relative w-[900px] h-[600px] z-[50] bg-base-100 rounded-lg overflow-hidden
                                    flex justify-center items-center">
                        {/* This is the top accent bar. */}
                        <div className="absolute top-0 left-o w-[100%] h-[15px] bg-accent rounded-t-lg">
                        </div>
                        {/* Actual Modal Content */}
                        <div className="flex w-[90%] h-[90%] flex-col">
                            {/* This is the "top bar" of the Modal. Contains the project title text, settings (if the user is an officer), and the exit button. */}
                            <div className="flex items-center justify-between">
                                {/* Project Title */}
                                <h3 className="text-primar h-[10%]y">{project.title}</h3>

                                {/* A div to group Settings and Exit so they are pushed to the far-right side. 
                                    Also this is flexed so the buttons dont stack up on each other.
                                */}
                                <div className="flex">
                                    {/* Settings Button (Only shows up if the user is an officer) */}
                                    {isOfficer && !(editMode) ? 
                                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer mr-[20px]" onClick={enableEditProjectModal}>
                                            <circle cx="12" cy="12" r="3" className="stroke-primary" stroke-width="1.5"/>
                                            <path d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2C11.0681 2 10.6022 2 10.2346 2.15224C9.74457 2.35523 9.35522 2.74458 9.15223 3.23463C9.05957 3.45834 9.0233 3.7185 9.00911 4.09799C8.98826 4.65568 8.70226 5.17189 8.21894 5.45093C7.73564 5.72996 7.14559 5.71954 6.65219 5.45876C6.31645 5.2813 6.07301 5.18262 5.83294 5.15102C5.30704 5.08178 4.77518 5.22429 4.35436 5.5472C4.03874 5.78938 3.80577 6.1929 3.33983 6.99993C2.87389 7.80697 2.64092 8.21048 2.58899 8.60491C2.51976 9.1308 2.66227 9.66266 2.98518 10.0835C3.13256 10.2756 3.3397 10.437 3.66119 10.639C4.1338 10.936 4.43789 11.4419 4.43786 12C4.43783 12.5581 4.13375 13.0639 3.66118 13.3608C3.33965 13.5629 3.13248 13.7244 2.98508 13.9165C2.66217 14.3373 2.51966 14.8691 2.5889 15.395C2.64082 15.7894 2.87379 16.193 3.33973 17C3.80568 17.807 4.03865 18.2106 4.35426 18.4527C4.77508 18.7756 5.30694 18.9181 5.83284 18.8489C6.07289 18.8173 6.31632 18.7186 6.65204 18.5412C7.14547 18.2804 7.73556 18.27 8.2189 18.549C8.70224 18.8281 8.98826 19.3443 9.00911 19.9021C9.02331 20.2815 9.05957 20.5417 9.15223 20.7654C9.35522 21.2554 9.74457 21.6448 10.2346 21.8478C10.6022 22 11.0681 22 12 22C12.9319 22 13.3978 22 13.7654 21.8478C14.2554 21.6448 14.6448 21.2554 14.8477 20.7654C14.9404 20.5417 14.9767 20.2815 14.9909 19.902C15.0117 19.3443 15.2977 18.8281 15.781 18.549C16.2643 18.2699 16.8544 18.2804 17.3479 18.5412C17.6836 18.7186 17.927 18.8172 18.167 18.8488C18.6929 18.9181 19.2248 18.7756 19.6456 18.4527C19.9612 18.2105 20.1942 17.807 20.6601 16.9999C21.1261 16.1929 21.3591 15.7894 21.411 15.395C21.4802 14.8691 21.3377 14.3372 21.0148 13.9164C20.8674 13.7243 20.6602 13.5628 20.3387 13.3608C19.8662 13.0639 19.5621 12.558 19.5621 11.9999C19.5621 11.4418 19.8662 10.9361 20.3387 10.6392C20.6603 10.4371 20.8675 10.2757 21.0149 10.0835C21.3378 9.66273 21.4803 9.13087 21.4111 8.60497C21.3592 8.21055 21.1262 7.80703 20.6602 7C20.1943 6.19297 19.9613 5.78945 19.6457 5.54727C19.2249 5.22436 18.693 5.08185 18.1671 5.15109C17.9271 5.18269 17.6837 5.28136 17.3479 5.4588C16.8545 5.71959 16.2644 5.73002 15.7811 5.45096C15.2977 5.17191 15.0117 4.65566 14.9909 4.09794C14.9767 3.71848 14.9404 3.45833 14.8477 3.23463C14.6448 2.74458 14.2554 2.35523 13.7654 2.15224Z" className="stroke-primary" stroke-width="1.5"/>
                                        </svg>
                                    : undefined}
                                    {/* Exit Button */}
                                    <svg width="30" height="30" viewBox="0 0 35 36" className="fill-primary cursor-pointer" onClick={unload}  xmlns="http://www.w3.org/2000/svg">
                                        <g clip-path="url(#clip0_23_61)">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9799 19.5201V32.4659H13.8773V23.1093L1.48865 35.5L0 34.0114L12.3907 21.6227H3.0341V19.5201H15.9799ZM33.5124 0.5L34.9989 1.98655L22.6103 14.3773H31.967V16.4799H19.0211V3.53408H21.1238V12.8886L33.5124 0.5Z" />
                                        </g>
                                    </svg>
                                </div>
                            </div>
                            {/* Actual content of the Modal */}
                            <div className="flex h-[90%] w-[100%] items-center justify-center relative  ">
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
                                        {
                                            editMode ?
                                            <ProjectModalInput label="Title" setTextState={setProjectTitle} presetValue={projectTitle} />
                                            :
                                            undefined
                                        }
                                        {/* Lead */}
                                        {
                                            editMode ?
                                                <ProjectModalDropdown text="Lead Select" setState={setLeadID} select={lead.name} options={users}/>
                                            :
                                            <p className="text-xl"><span className="font-bold">Lead:</span> {lead.name}</p>
                                        
                                        }
                                        {/* Contact */}
                                        {
                                            editMode ?
                                            undefined
                                            :
                                            <p className="text-xl"><span className="font-bold">Contact:</span> {lead.email}</p>
                                        }
                                        {/* Description */}
                                        {
                                            editMode ?
                                            <ProjectModalInput label="Description" setTextState={setDescription} presetValue={project.description} />
                                            :
                                            <p className="text-lg mb-[10px]">{project.description}</p>
                                        }
                                        {/* Email */}
                                        {
                                            editMode ?
                                            undefined
                                            :
                                            <ProjectLink url={"mailto:" + lead.email} text="Email"/>
                                        }
                                        {/* Repo Link */}
                                        {
                                            editMode ?
                                            <ProjectModalInput label="Repository Link" setTextState={setRepoLink} presetValue={project.repoLink} />
                                            :
                                            <ProjectLink url={project.repoLink} text="Repo Link" />
                                        }
                                        {/* Project Image URL */}
                                        {
                                            editMode ?
                                            <ProjectModalInput label="Project Image" setTextState={setRepoLink} presetValue={project.projectImage} />
                                            :
                                            undefined
                                        }
                                        
                                    </div>

                                    {/* Hear me out, a flex box might have been better to place these add/cancel buttons for the Edit view, but I was NOT trying to mess around with that. */}
                                    {
                                        editMode ?
                                        <div className="absolute bottom-0 right-0">

                                        <button className="bg-success text-black p-[12px] px-[25px] rounded-lg" onClick={editProject}>Edit</button>
                                        <button className="bg-error p-[10px] px-[25px] rounded-lg ml-[15px]" >Delete</button>
                                        </div>
                                        :
                                        undefined
                                    }
                            </div>
                        </div>
                    </div>
                </div> : undefined
            }
        </div>
    )
}

export default ProjectModal;