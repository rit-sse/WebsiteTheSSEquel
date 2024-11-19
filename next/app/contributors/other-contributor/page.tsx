import Carousel from "@/components/Carousel";

export default function Page() {
  /* Put all pictures you want of yourself here */
  const imageOne = ["/kitty_cat_1.jpg", "/kitty_cat_2.jpg", "/kitty_cat_3.jpg"];
  return (
    <div>
      <h1 className="mb-8">Tech Com Member</h1>
      <div className="flex flex-col-reverse items-center md:items-start md:flex-row md:justify-between gap-10 mb-4">
        {/* picture of yourself */}
        <Carousel images={imageOne} />
        <div className="">
          {/* Type a Greeting */}
          <p className="font-bold text-2xl/relaxed text-center mb-4">
            Hey! I'm a Tech Com Member
          </p>
          {/* About you; what you do/did */}
          <p className="m-4 text-center md:m-auto md:w-[900px]">
            I'm a *Year* here at RIT and I love Lorem ipsum dolor sit, amet
            consectetur adipisicing elit. Quasi rerum eius, culpa fuga qui
            tenetur iusto atque veritatis, aliquid dolore dolorum dolorem at
            laborum cupiditate enim explicabo, vel minus illum?
          </p>
        </div>
      </div>
    </div>
  );
}
