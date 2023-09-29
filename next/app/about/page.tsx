// This is the file that renders the /about route of the website.
import RootLayout from "../layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The Society of Software Engigneers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const About = () => {
  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-32 flex flex-col items-center">
        <h1
          className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
          text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
        >
          About Us
        </h1>

        <p className="mx-auto mt-4 max-w-2xl sm:text-xl/relaxed">
          The Society of Software Engineers (SSE) is a student organization at RIT composed of software engineers, computer scientists, and other students. 
          We have over fifty active members that participate in mentoring, software projects, intramural sports, and social events. 
          The SSE has strong relationships with companies like Microsoft, Google, Apple, Northrup Grumman, Goodrich, IBM, and Oracle. 
          We work closely with companies in the software industry to provide our members with potential career opportunities.
        </p>
      </div>
    </>
  );
};

export default About;
