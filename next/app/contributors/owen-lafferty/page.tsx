import Carousel from "@/components/Carousel";

export default function Page() {
  /* Put all pictures you want of yourself here */
  const imageOne = [
    "/contributors/Owen-Lafferty-GoLersBB.png",
    "/contributors/Owen-Lafferty-meMomma.png",
  ];
  return (
    <div>
      <h1 className="mb-8">Owen Lafferty</h1>
      <div className="flex flex-col-reverse items-center md:items-start md:flex-row gap-10">
        {/* picture of yourself */}
        <Carousel images={imageOne} />
        <div>
          {/* Type a Greeting */}
          <p className="font-bold text-2xl/relaxed text-center mb-4">
            Hey! I'm Owen Lafferty
          </p>
          {/* About you; what you do/did */}
          <p className="m-4 text-center md:m-auto">
            I'm a freshman, Software Engineering major (wow, what a surprise)
            here at RIT (as of Fall 2024) and have been loving it so far! I'm a
            front end developer on this project which has been very useful for
            me. Before coming here, I never really developed anything other than
            a basic high school project and this has really shed light into what
            developing a project is actually like. Uhhhh. 
          </p>
        </div>
      </div>
    </div>
  );
}
