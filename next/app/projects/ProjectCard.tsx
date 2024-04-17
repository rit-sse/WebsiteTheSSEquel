import React from "react";
import { Project } from "./projects";
import Image from "next/image";

const ProjectCard = ({logo, title, lead, contact, description, stack, progress}: Project) => {
  return (
    <div className="rounded-lg bg-base-100 w-10/12 py-8 px-12 mx-auto flex flex-row items-center content-center gap-10 my-10">
      {/* Left half */}
      <Image 
        src={logo} 
        alt={title}
        width="400"
        height="240"
      />

      {/* Right half */}                                   
      <div>
        {/* Heading */}
        <h1 className="text-2xl font-bold text-primary text-left mb-4">
          {title ? title : "Default"}
        </h1>
        
        {/* Body */}
        <div className="text-lg flex flex-col gap-2">
          <div>
            <span className="font-bold">Project Lead: </span>
            {lead ? lead : "Default"}
          </div>

          <div>
            <span className="font-bold">Contact: </span>
            {contact ? contact : "Default"}
          </div>

          <div>
            <span className="font-bold">Tech Stack: </span>
            {stack ? stack : "Default"}
          </div>

          <div>
            <span className="font-bold">Description: </span>
            {description ? description : "Default"}
          </div>

          <div>
            <span className="font-bold">Progress: </span>
            {progress ? progress : "Default"}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
