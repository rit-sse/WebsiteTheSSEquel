"use client"
import React from "react";
import ProjectCard from "./ProjectCard";
import { Project, projectsData } from "./projects";
import { useState } from "react";

const Projects = () => {

  const [projects, setProjects] = useState(projectsData);

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
          <div className="leading-8">Want to build? We'll make it happen.</div>
          <div className="text-xl text-primary opacity-70 mt-1">
            Write to projects@sse.rit.edu for more info.
          </div>
        </div>
      </section>

      {/* Exhibit */}
      <section className="exihibit">
        {
          projects.map(
            (project, key) => (
              <ProjectCard key={key} {...project} />
            )
          )
        }
      </section>
    </>
  );
};

export default Projects;
