import { Metadata } from "next";
import slotData from "./ProjectsSlotContent";
import ZCardContainer from "@/components/ZCardContainer";
import {AboutUsSlot} from "@/app/about/AboutUsSlot";
import { ProjectsSlot } from "./ProjectsSlot";

export const metadata: Metadata = {
    title: "About Us",
    description:
      "The Society of Software Engineers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
  };
  
  const Projects = () => {
    return (
      <>
        <div className="px-4 py-16 flex flex-1 flex-col items-center w-11/12">
          <h1
            className="bg-gradient-to-t from-primary to-secondary bg-clip-text
            text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
          >
            Projects
          </h1>
  
          <div className="w-full md:w-5/6 space-y-24 pb-8">
            <p className="w-3/5 mt-4 text-center sm:text-xl/relaxed m-auto">
              TESS IS TECH HEAD. TESS IS TECH HEAD. TESS IS TECH HEAD. TESS IS TECH HEAD.
              TESS IS TECH HEAD. TESS IS TECH HEAD. TESS IS TECH HEAD. TESS IS TECH HEAD.
            </p>
          </div>
  
          <ZCardContainer contentSlots={
            slotData.map(slot => new ProjectsSlot(
                slot.imageSrc, slot.name, slot.description, slot.contactName, slot.contact, slot.alt
            ))
          } />
        </div>
      </>
    );
  };
  
  export default Projects;
  