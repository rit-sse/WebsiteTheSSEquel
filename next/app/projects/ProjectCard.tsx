import React, { useEffect, useState } from "react";
import { Project } from "./projects";
import Image from "next/image";

var onItem = 0;

const ProjectCard = ({logo, title, lead, contact, description, stack, progress}: Project) => {
  let projectBackground = logo == "" ? "images/SSEProjectPlaceholder.png" : logo
  let [cardOpacity, setOpacity] = useState(0)

  
  function openModal() {
    alert(title)
  }

  useEffect(() => {
    onItem += 1;
    setTimeout(() => {
        setOpacity(1);
    }, 60 * onItem);
  }, [])
  

  return(
    <div className="relative w-[240px] h-[320px] bg-black rounded-lg
                    inline-block me-4 my-3 overflow-hidden
                    
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
        <p className="text-white text-base font-bold">{title}</p>
      </div>
    </div>
  )
};


export default ProjectCard;
