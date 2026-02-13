"use client";
import React, { Dispatch, SetStateAction, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import { Project } from "./projects";
import { useState } from "react";
import AddProjectModal from "./AddProjectModal";
import { Card } from "@/components/ui/card";

interface OfficerLookup {
  is_active: boolean;
  position: { title: string };
  user: { email: string };
}

const Projects = () => {
  // projects has an array of Project[]
  // Also, Dispatch<SetStateAction<never[]>> makes sure this format is followed. Otherwise, an error would occur
  // Also ALSO, the above dispatch is apparently required so I can declare projects to be Project[], so that project.completed would not throw an error in VSCode
  const [projects, setProjects]: [Project[], Dispatch<SetStateAction<never[]>>] = useState([]);
  const [isOfficer, setOfficer] = useState(false);
  const [projectsHeadEmail, setProjectsHeadEmail] = useState<string | null>(null);

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

    fetch("/api/officer")
    .then(res => res.json())
    .then((officers: OfficerLookup[]) => {
      const projectsHead = officers.find(
        (officer) => officer.is_active && officer.position.title === "Projects Head"
      );
      setProjectsHeadEmail(projectsHead?.user?.email ?? null);
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
    <section className="w-full py-8 px-4 md:px-8 lg:px-12">
      <div className="w-full">
        <Card depth={1} className="p-6 md:p-8">
          {/* Intro */}
          <div className="text-center mb-8">
            <h1 className="text-primary">
              Projects
            </h1>
            <div className="mt-3 text-xl">
              <div className="leading-8">Our mission is simple.</div>
              <div className="leading-8">Want to build? We&apos;ll make it happen.</div>
              <div className="text-xl text-primary opacity-70 mt-1">
                Write to{" "}
                <span className="hover:underline hover:font-bold">
                  <a href={`mailto:${projectsHeadEmail ?? "softwareengineering@rit.edu"}`}>
                    {projectsHeadEmail ?? "softwareengineering@rit.edu"}
                  </a>
                </span>{" "}
                for more info.
              </div>
            </div>
            
            {/* Officer-only Add Project Modal Button */}
            { isOfficer ? 
              <div className="flex justify-center mt-6">
                <button className="bg-primary text-primary-foreground px-[25px] py-[10px] rounded-lg" onClick={enableModal}>Add Project</button>
              </div>
              : undefined}
          </div>
          
          {/* Current Projects */}
          <div className="mb-8">
            <h2 className="text-primary text-center lg:text-left mb-4">
              Current Projects
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {inProgress.map((project, key) => (
                <ProjectCard key={key} project={project} propKey={key} isOfficer={isOfficer} />
              ))}
            </div>
          </div>

          {/* Past Projects */}
          <div>
            <h2 className="text-primary text-center lg:text-left mb-4">
              Past Projects
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {done.map((project, key) => (
                <ProjectCard key={key} project={project} propKey={key} isOfficer={isOfficer}/>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      <AddProjectModal enabled={addProjectModalEnabled} setEnabled={setAddProjectModalEnabled}/>
    </section>
  );
};

export default Projects;
