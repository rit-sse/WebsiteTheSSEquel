// This is the file that renders the /about route of the website.
import { Metadata } from "next";
import Image from 'next/image'
import { Children } from "react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The Society of Software Engigneers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const ZCard: React.FC<{ image: 'left' | 'right', children: React.ReactNode }> = ({ image, children }) => {
  const [left, right, ...rest] = Children.toArray(children);

  if (rest.length > 0) throw new Error("ZCard can only have two children");

  return <div className="flex items-center gap-8">
    <div className="w-1/2">
      {left}
    </div>
    <div className="w-1/2">
      {right}
    </div>
  </div>;
};

const About = () => {
  const placeholder_w = 600
  const placeholder_h = 500

  const placeholder_img = <Image 
      src={`https://dummyimage.com/${placeholder_w}x${placeholder_h}`}
      alt="Placeholder"
      width={placeholder_w}
      height={placeholder_h}
      className="w-full h-auto rounded-md"
    />

  return (
    <>
      <div className="min-w-full px-4 py-32 flex flex-1 flex-col items-center">
        <h1
          className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
            text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
        >
          About Us
        </h1>

        <div className="w-3/4 space-y-24">
          <p className="mt-4 sm:text-xl/relaxed w-2/3 m-auto">
            The Society of Software Engineers (SSE) is a student organization at
            RIT composed of software engineers, computer scientists, and other
            students.
          </p>

          <ZCard image='right'>
            <p className="mt-4 sm:text-xl/relaxed">
              Our lab (GOL-1670) is open for mentoring on weekdays from 10:00AM to
              6:00PM and any student, can come and ask questions for any class in
              the Software Engineering curriculum. The Mentoring Committee offers
              1-on-1 tutoring and holds practice exams for popular computer
              science and software engineering classes.
            </p>
            {placeholder_img}
          </ZCard>

          <ZCard image='left'>
            {placeholder_img}
            <p className="mt-4 sm:text-xl/relaxed">
              The projects committee is a recent addition to the society, but it
              is by no means the smallest. In the projects committee, SSE members
              come together and work on software engineering projects for fun and
              research. Our current and past projects include a singing tesla
              coil, a web-controllable slideshow for our TV displays, and a large
              multitouch wall.
            </p>
          </ZCard>
        </div>
      </div>
    </>
  );
};

export default About;
