import React from "react";

const ProjectCard = () => {
  return (
    <div className="rounded-lg bg-base-100 w-9/12 py-8 px-12 mx-auto flex flex-row items-center content-center gap-10 my-10">
      {/* Left half */}
      <div className="text-9xl">🐞</div>

      {/* Right half */}
      <div>
        
        {/* Heading */}
        <h1 className="text-2xl text-primary text-left mb-4">
          Project Name 
        </h1>
        
        {/* Body */}
        <div className="text-lg flex flex-col gap-2">
          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Supervisor: </span>
            Name
          </div>

          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Contact: </span>
            personal@email.com
          </div>

          <div>
            {/* <div className="mb-2"> */}
            <span className="font-bold">Description: </span>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia,
            aliquid. Laudantium veritatis veniam praesentium nesciunt facilis
            quod quam nihil labore perferendis, qui molestiae ad quibusdam
            magnam consequatur tempore, hic minus!
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
