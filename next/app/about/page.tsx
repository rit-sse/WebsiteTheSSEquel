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

  // const classLeft = image == 'left' ? "w-1/4" : "w-3/4";
  // const classRight = image == 'right' ? "w-1/4" : "w-3/4";

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
          className="bg-gradient-to-r from-primary to-accent bg-clip-text
            text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
        >
          About Us
        </h1>

        <div className="w-5/6 space-y-24">
          <p className="w-4/5 mt-8 sm:text-xl/relaxed m-auto">
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
                GOL-1670 offers weekday Software Engineering mentoring and
                tutoring. Experience the SSE Winter Ball, partake in trips and
                movies, or join our intramural sports. Academics and recreation,
                seamlessly combined.
              </p>
            </div>
            {placeholder_img}
          </ZCard>

          <ZCard image="left">
            {placeholder_img}
            <div className="">
              <h3 className="text-3xl font-bold">Hands-On Experience</h3>
              <p className="mt-8 sm:text-xl/relaxed">
                In the Projects Committee, SSE members collaborate on unique
                software projects, from singing tesla coils to multitouch walls.
                Additionally, our Rapid Development Weekends offer a fast-paced
                experience, producing everything from games to file transfer
                systems in just two days.
              </p>
            </div>
          </ZCard>
        </div>
      </div>
    </>
  );
};

export default About;
