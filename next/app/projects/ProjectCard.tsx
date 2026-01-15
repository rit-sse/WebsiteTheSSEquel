import React, { useEffect, useState } from "react";
import { Project } from "./projects";
import Image from "next/image";
import ProjectModal from "./ProjectModal";
import { Card } from "@/components/ui/card";

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
    <div className="w-full">
      <Card 
        depth={2}
        className="relative h-[320px] overflow-hidden cursor-pointer
                   transition-all duration-150 ease-out
                   hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        onClick={openModal} 
        style={{opacity: cardOpacity, transform: translationLoad}}
      >
        {/* Image Background */}
        <Image 
          src={projectBackground} 
          alt={project.title}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Project Title Container */}
        <div className="absolute bottom-0 w-full min-h-[48px] max-h-[80px] bg-black/40 backdrop-blur-md
                        p-3 flex items-center">
          <p className="text-white text-base font-bold font-display line-clamp-2">{project.title}</p>
        </div>
      </Card>
      {/* Project Modal associated with the card */}
      <ProjectModal enabled={modalEnabled} setEnabled={setModalEnabled} project={project} isOfficer={isOfficer}/> 
    </div>
  )
};

export default ProjectCard;
