import React, { useEffect, useState } from "react";
import { Project } from "./projects";
import Image from "next/image";
import ProjectModal from "./ProjectModal";

// This is used to create the structure of the Project Card arguments.
interface ProjectCardArguments {
  project: Project
}

const ProjectCard = ({project, propKey, isOfficer}: {project: Project, propKey: number, isOfficer: boolean}) => {
  // If the project.logo is empty, we are replacing it with the placeholder image
  let projectBackground = (
    (project.projectImage == "") || 
    (project.projectImage == undefined) ||
    (project.projectImage == null)
  ) ? "images/SSEProjectPlaceholder.png" : project.projectImage
  
  // This is used for the transition. The opacity of the card uses this.
  let [cardOpacity, setOpacity] = useState(0)

  // Enables the modal. setModalEnabled is passed to the modal in order for certain functions (such as clicking the black background and the exit button) to close the modal.
  let [modalEnabled, setModalEnabled] = useState(false);

  // This is the beginning transition. This is responsible for the "sliding up" effect on load.
  // This gets sets to an empty string on useEffect
  let [translationLoad, setTransitionDelay] = useState("translateY(15px)");

  // Used as the onClick function to appear the Modal
  function openModal() {
    setModalEnabled(true);
  }

  // On card load (using useEffect), it will use the onItem as the milisecond multiplier (to give a gradual appearance transition).
  // It will then increment onItem so later cards will have a longer wait time.
  useEffect(() => {
    propKey += 1;
    setTimeout(() => {
        // MAKE IT APPEAR!!
        setOpacity(1);
        // MAKE IT SLIDE UP!
        setTransitionDelay("");
    }, 30 * propKey);
  }, [])
  
  return(
    // Card Container. Uses inline-block to make sure all cards line up correctly.
    //  TODO: Lets do a grid on this instead.
    <div className="inline-block transition-transform duration-300 ease-in-out  ">
      {/* Card Contents */}
      <div className="relative w-[240px] h-[320px] bg-black rounded-lg
                       me-4 my-3 overflow-hidden
                      
                      transition-all
                      duration-300 ease-in-out
                      hover:-translate-y-2
                      hover:shadow-xl
                      hover:cursor-pointer
                      " onClick={openModal} style={{opacity: cardOpacity, transform: translationLoad}}>
        {/* Image Background */}
        <img src={projectBackground} className="h-[100%] w-[100%] object-cover"/>
        {/* Project Title Container */}
        <div className="absolute bottom-[0px] w-[100%] h-[48px] bg-black/25 backdrop-blur-[15px]
                        p-[12px]
                        flex items-center justify-left">
          {/* Project Title */}
          <p className="text-white text-base font-bold">{project.title}</p>
        </div>
        
      </div>
      {/* Project Modal associated with the card */}
      <ProjectModal enabled={modalEnabled} setEnabled={setModalEnabled} project={project} isOfficer={isOfficer}/> 
    </div>
  )
};


export default ProjectCard;
