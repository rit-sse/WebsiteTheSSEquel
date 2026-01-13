"use client";
import React, { Dispatch, SetStateAction, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import { Project } from "./projects";
import { useState } from "react";
import AddProjectModal from "./AddProjectModal";

const Projects = () => {
  // projects has an array of Project[]
  // Also, Dispatch<SetStateAction<never[]>> makes sure this format is followed. Otherwise, an error would occur
  // Also ALSO, the above dispatch is apparently required so I can declare projects to be Project[], so that project.completed would not throw an error in VSCode
  const [projects, setProjects]: [Project[], Dispatch<SetStateAction<never[]>>] = useState([]);
  const [isOfficer, setOfficer] = useState(false);

  // Enables the AddProject modal. setAddProjectModalEnabled is passed to the modal in order for certain functions (such as clicking the black background and the exit button) to close the modal.
  let [addProjectModalEnabled, setAddProjectModalEnabled] = useState(false);

  // Separates projects that are in progress and ones that are done.
  // This helps to not only make it more clear, but also better to work with.
  const inProgress:Project[] = []
  const done:Project[] = []

  
  useEffect(() => {
    // Fetch the user's ID.
    fetch("/api/authLevel")
    .then(resp => resp.json())
    .then(resp => {
      console.log(resp)
      setOfficer(resp["isOfficer"]);
    })

    // Fetch projects.
    fetch("/api/project")
    .then(res => res.json())
    .then(resp => {
      setProjects(resp)
      console.log(resp)
    })
  }, [])

  // Sort them from projects array.
  for(let project of projects) {
    if(!project.completed) {
      inProgress.push(project);
    } else {
      done.push(project);
    }
  }

  let enableModal = () => {
    setAddProjectModalEnabled(true);
  }

  return (
    <>
      {/* Intro */}
      <section className="intro mt-16 mb-5 max-w-2xl mx-auto">
        <h1
          className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
        >
          Projects
        </h1>
        <div className="mt-3 text-xl text-center">
          <div className="leading-8">Our mission is simple.</div>
          <div className="leading-8">Want to build? We&apos;ll make it happen.</div>
          <div className="text-xl text-primary opacity-70 mt-1">
            Write to <span className="hover:underline hover:font-bold"><a href="mailto:projects@sse.rit.edu">projects@sse.rit.edu</a></span> for more info.
          </div>
        </div>
      </section>

      {/* Officer-only Add Project Modal Button */}
      { isOfficer ? 
        <button className="bg-primary text-primary-foreground px-[25px] py-[10px] rounded-lg" onClick={enableModal}>Add Project</button>
        : undefined}
      
      {/* Exhibit */}
      {/* Load the projects that are currently in the works first. */}
      <section className="exhibit w-4/5 min-h-[400px]">
        <h1
          className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-2xl
              text-center
              
              lg:text-left">
          Current Projects
        </h1>
        {inProgress.map((project, key) => (
          <ProjectCard key={key} project={project} propKey={key} isOfficer={isOfficer} />
        ))}
      </section>
      {/* Load past projects that are done. */}
      <section className="exhibit w-4/5 min-h-[400px]">
        <h1
          className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-2xl
              text-center
              
              lg:text-left">
          Past Projects
        </h1>
        {done.map((project, key) => (
          <ProjectCard key={key} project={project} propKey={key} isOfficer={isOfficer}/>
        ))}
        
      </section>
      <AddProjectModal enabled={addProjectModalEnabled} setEnabled={setAddProjectModalEnabled}/>
    </>
  );
};

export default Projects;
