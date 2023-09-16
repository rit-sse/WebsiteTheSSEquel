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
      <h1
        className="bg-gradient-to-r from-sky-200 to-emerald-400 bg-clip-text
                         text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
      >
        About Us
      </h1>
    </>
  );
};

export default About;
