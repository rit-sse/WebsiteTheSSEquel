import React from "react";
import { Project } from "./projects";

const ProjectCard = ({logo, title, lead, contact, description, stack}: Project) => {
  return (
    <div className="rounded-lg bg-base-100 w-10/12 py-8 px-12 mx-auto flex flex-row items-center content-center gap-10 my-10">
      {/* Left half */}
      <div className="text-9xl">{logo || "❓"}</div>

      {/* Right half */}
      <div>
        {/* Heading */}
        <h1 className="text-2xl font-bold text-primary text-left mb-4">
          {title ? title : "Default"}
        </h1>
        
        {/* Body */}
        <div className="text-lg flex flex-col gap-2">
          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Project Lead: </span>
            {lead ? lead : "Default"}
          </div>

          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Contact: </span>
            {contact ? contact : "Default"}
          </div>

          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Description: </span>
            {description ? description : "Default"}
          </div>

          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Tech Stack: </span>
            HTML/CSS, JavaScript, React, Next
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
