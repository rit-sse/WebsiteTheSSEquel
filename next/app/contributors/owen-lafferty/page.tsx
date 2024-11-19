import Carousel from "@/components/Carousel";

export default function Page() {
  /* Put all pictures you want of yourself here */
  const imageOne = [
    "/contributors/Owen-Lafferty-GoLersBB.jpg",
    "/contributors/Owen-Lafferty-meMomma.jpg",
  ];
  return (
    <div>
      <h1 className="mb-8">Owen Lafferty</h1>
      <div className="flex flex-col-reverse items-center md:items-start md:flex-row md:justify-between gap-10 mb-4">
        {/* picture of yourself */}
        <Carousel images={imageOne} />
        <div className="">
          {/* Type a Greeting */}
          <p className="font-bold text-2xl/relaxed text-center mb-4">
            Hey! I'm Owen Lafferty
          </p>
          {/* About you; what you do/did */}
          <p className="m-4 text-center md:m-auto md:w-[900px]">
            I'm a freshman Software Engineering major (wow, what a surprise)
            here at RIT (as of Fall 2024) and have been loving it so far! I'm
            from Pittsburgh, PA, more specifically the township of South Park, where there are
            friendly faces everywhere and humble folks without temptations (apparently). I spend almost all of my free time playing video games, mostly fighting games, but I also, especially recently, play some really good story games too. But being honest, I play at least a little bit of everything. Other than that, I really am just a student. Pretty boring. <br/>Go Steelers.
          </p>
        </div>
      </div>
    </div>
  );
}
