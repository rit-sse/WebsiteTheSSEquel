import React, { useEffect, useState } from "react";
import { Project } from "./projects";
import Image from "next/image";
import ProjectModal from "./ProjectModal";

// This is used for the gradual transition effect.
var onItem = 0;

// This is used to create teh structure of the Project Card arguments.
interface ProjectCardArguments {
  project: Project
}

const ProjectCard = ({project}: ProjectCardArguments) => {
  // If the project.logo is empty, we are repalcing it with the placeholder image
  let projectBackground = project.logo == "" ? "images/SSEProjectPlaceholder.png" : project.logo
  
  // This is used for the transition. The opacity of the card uses this.
  let [cardOpacity, setOpacity] = useState(0)

  // Enables the modal. setModalEnabled is passed to the modal in order for certain functions (such as clicking the black background and the exit button) to close the modal.
  let [modalEnabled, setModalEnabled] = useState(false);

  // Used as the onClick function to appear the Modal
  function openModal() {
    setModalEnabled(true);
  }

  // On card load (using useEffect), it will use the onItem as the milisecond multiplier (to give a gradual appearance transition).
  // It will then increment onItem so later cards will have a longer wait time.
  useEffect(() => {
    onItem += 1;
    setTimeout(() => {
        setOpacity(1);
    }, 30 * onItem);
  }, [])
  
  return(
    // Card Container. Uses inline-block to make sure all cards line up correctly.
    //  TODO: Lets do a grid on this instead.
    <div className="inline-block">
      {/* Card Contents */}
      <div className="relative w-[240px] h-[320px] bg-black rounded-lg
                       me-4 my-3 overflow-hidden
                      
                      transition-all
                      duration-300 ease-in-out
                      hover:-translate-y-2
                      hover:shadow-xl
                      hover:cursor-pointer
                      " onClick={openModal} style={{opacity: cardOpacity}}>
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
      <ProjectModal enabled={modalEnabled} setEnabled={setModalEnabled} project={project}/> 
    </div>
  )
};


export default ProjectCard;
