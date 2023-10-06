// This is the file that renders the /about route of the website.
import { Metadata } from "next";
import Image from "next/image";
import { Children } from "react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The Society of Software Engigneers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const ZCard: React.FC<{
  image: "left" | "right";
  children: React.ReactNode;
}> = ({ image, children }) => {
  const [left, right, ...rest] = Children.toArray(children);

  if (rest.length > 0) throw new Error("ZCard can only have two children");

  return (
    <div className="flex items-center  gap-24">
      <div className="w-1/2">{left}</div>
      <div className="w-1/2">{right}</div>
    </div>
  );
};

const About = () => {
  const placeholder_w = 550;
  const placeholder_h = 400;

  const placeholder_img = (
    <Image
      src={`https://dummyimage.com/${placeholder_w}x${placeholder_h}`}
      alt="Placeholder"
      width={placeholder_w}
      height={placeholder_h}
      className="w-full h-auto rounded-md"
    />
  );

  return (
    <>
      <div className="px-4 py-32 flex flex-1 flex-col items-center w-11/12">
        <h1
          className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
            text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
        >
          About Us
        </h1>

        <div className="w-5/6 space-y-24">
          <p className="w-1/2 mt-8 sm:text-xl/relaxed m-auto">
            The Society of Software Engineers at RIT fosters a vibrant community
            of tech enthusiasts, bridging academia with industry partnerships
            from giants like Microsoft to Apple, ensuring our members thrive in
            their future careers.
          </p>

          <ZCard image="right">
            <div className="">
              <h3 className="text-3xl font-bold">
                All-In-One Hub For Developers
              </h3>
              <p className="mt-8 sm:text-xl/relaxed">
                Our lab (GOL-1670) is open for mentoring on weekdays from
                10:00AM to 6:00PM and any student, can come and ask questions
                for any class in the Software Engineering curriculum. The
                Mentoring Committee offers 1-on-1 tutoring and holds practice
                exams for popular computer science and software engineering
                classes.
              </p>
            </div>
            {placeholder_img}
          </ZCard>

          <ZCard image="left">
            {placeholder_img}
            <div className="">
              <h3 className="text-3xl font-bold">Hands-On Experience</h3>
              <p className="mt-8 sm:text-xl/relaxed">
                The projects committee is a recent addition to the society, but
                it is by no means the smallest. In the projects committee, SSE
                members come together and work on software engineering projects
                for fun and research. Our current and past projects include a
                singing tesla coil, a web-controllable slideshow for our TV
                displays, and a large multitouch wall.
              </p>
            </div>
          </ZCard>
        </div>
      </div>
    </>
  );
};

export default About;
