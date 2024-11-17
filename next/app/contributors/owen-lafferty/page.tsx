import Carousel from "@/components/Carousel";

export default function Page() {
  /* Put all pictures you want of yourself here */
  const imageOne = ["/kitty_cat_1.jpg", "/kitty_cat_2.jpg", "/kitty_cat_3.jpg"];
  return (
    <div>
      <h1 className="mb-8">Owen Lafferty</h1>
      <div className="flex flex-col-reverse items-center md:items-start md:flex-row md:justify-between gap-10 mb-4">
        {/* picture of yourself */}
        <Carousel images={imageOne} />
        <div>
          {/* Type a Greeting */}
          <p className="font-bold text-2xl/relaxed text-center mb-4">
            Hey! I'm Owen Lafferty
          </p>
          {/* About you; what you do/did */}
          <p className="m-4 text-center md:m-auto">
            I'm a freshman here at RIT Lorem ipsum dolor sit amet consectetur, adipisicing elit.
            Distinctio natus totam consequuntur numquam ex cumque animi,
            exercitationem commodi quaerat sit. Veritatis minima quae illo
            commodi sequi vero eum quam architecto? Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Natus quibusdam voluptate doloribus
            fugiat est nostrum quae consequuntur? Itaque ad, totam accusamus,
            eveniet quisquam porro eligendi error numquam nam temporibus
            obcaecati. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Facilis labore temporibus soluta nisi accusantium, nesciunt nemo
            deleniti delectus dolores debitis fugiat eius recusandae! Rerum quas
            obcaecati iste recusandae unde et.
          </p>
        </div>
      </div>
    </div>
  );
}
