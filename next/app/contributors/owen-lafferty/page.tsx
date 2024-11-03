import Image from "next/image";

export default function Page() {
  return (
    <div>
      <h1 className="mb-8">Owen Lafferty</h1>
      <div className="flex flex-col-reverse items-center md:items-start md:flex-row md:justify-between gap-5 mb-4">
        {/* picture of yourself */}
        <Image
          src="/kitty_cat_1.jpg"
          width={640}
          height={1}
          className="rounded-[60px]"
          alt="a cat"
        />
        <div>
          {/* Type a Greeting */}
          <p className="font-bold text-2xl/relaxed text-center mb-4">
            Hey! I'm Owen Lafferty
          </p>
          {/* About you; what you do/did */}
          <p className="m-4 text-center md:m-auto">
            I'm a freshman here at RIT (as of November 2024) and have been
            loving it. Lorem ipsum dolor sit amet consectetur, adipisicing elit. Distinctio natus totam consequuntur numquam ex cumque animi, exercitationem commodi quaerat sit. Veritatis minima quae illo commodi sequi vero eum quam architecto? Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus quibusdam voluptate doloribus fugiat est nostrum quae consequuntur? Itaque ad, totam accusamus, eveniet quisquam porro eligendi error numquam nam temporibus obcaecati. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis labore temporibus soluta nisi accusantium, nesciunt nemo deleniti delectus dolores debitis fugiat eius recusandae! Rerum quas obcaecati iste recusandae unde et.
          </p>
        </div>
      </div>
      <div className="flex flex-col-reverse items-center md:items-start md:flex-row md:justify-between gap-5 ">
        {/* Throw any extra images you want here */}
        {/* <Image
            src="/kitty_cat_2.jpg"
            width={640}
            height={1}
            className="rounded-[60px]"
            alt="another cat"
          />  */}
      </div>
    </div>
  );
}
