"use client";
import React from "react";
import ProjectCard from "./ProjectCard";
import { Project, projectsData } from "./projects";
import { useState } from "react";

const Projects = () => {
  const [projects, setProjects] = useState(projectsData);

  // Separates projects that are in progress and ones that are done.
  // This helps to not only make it more clear, but also better to work with.
  const inProgress:Project[] = []
  const done:Project[] = []

  // Sort them from projects array.
  for(let project of projects) {
    if(project.progress != "Complete") {
      inProgress.push(project);
    } else {
      done.push(project);
    }
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

      {/* Exhibit */}
      {/* <section className="exihibit">
        {projects.map((project, key) => (
          <ProjectCard key={key} {...project} />
        ))}
      </section> */}
      <section className="exhibit w-4/5">
        <h1
          className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-2xl text-left">
          Current Projects
        </h1>
        {inProgress.map((project, key) => (
          <ProjectCard key={key} project={project} />
        ))}
      </section>
      <section className="exhibit w-4/5">
        <h1
          className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-2xl text-left">
          Past Projects
        </h1>
        {done.map((project, key) => (
          <ProjectCard key={key} project={project}/>
        ))}
      </section>
    </>
  );
};

export default Projects;
