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
            friendly faces everywhere and humble folks without temptations. 
          </p>
        </div>
      </div>
    </div>
  );
}
