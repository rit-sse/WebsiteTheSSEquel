import React, { useEffect, useState } from "react";
import { Project } from "./projects";
import Image from "next/image";
import ProjectModal from "./ProjectModal";

var onItem = 0;

interface ProjectCardArguments {
  project: Project
}

const ProjectCard = ({project}: ProjectCardArguments) => {
  let projectBackground = project.logo == "" ? "images/SSEProjectPlaceholder.png" : project.logo
  let [cardOpacity, setOpacity] = useState(0)
  let [modalEnabled, setModalEnabled] = useState(false);

  
  function openModal() {
    setModalEnabled(true);
  }

  useEffect(() => {
    onItem += 1;
    setTimeout(() => {
        setOpacity(1);
    }, 40 * onItem);
  }, [])
  

  return(
    <div className="inline-block">
      <div className="relative w-[240px] h-[320px] bg-black rounded-lg
                       me-4 my-3 overflow-hidden
                      
                      transition-all
                      duration-300 ease-in-out
                      hover:-translate-y-2
                      hover:shadow-xl
                      hover:cursor-pointer
                      " onClick={openModal} style={{opacity: cardOpacity}}>
        <img src={projectBackground} className="h-[100%] w-[100%] object-cover"/>
        <div className="absolute bottom-[0px] w-[100%] h-[48px] bg-black/25 backdrop-blur-[15px]
                        p-[12px]
                        flex items-center justify-left">
          <p className="text-white text-base font-bold">{project.title}</p>
        </div>
        
      </div>
      <ProjectModal enabled={modalEnabled} setEnabled={setModalEnabled} project={project}/> 
    </div>
  )
};


export default ProjectCard;
