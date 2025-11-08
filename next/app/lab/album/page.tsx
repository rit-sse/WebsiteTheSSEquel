import { Metadata } from "next";
import Image from 'next/image';
import images from "./AlbumLoader";


export const metadata: Metadata = {
  title: "Album",
  description:
    "The Society of Software Engineers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const Album = () => {
  return (
    <>
      <section>
        <div className="text-page-structure">
          <h1>SSE Album</h1>
          <div className="subtitle-structure">
            <p>
              A collection of pictures from the SSE
            </p>
          </div>

          <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-1
                    md:grid-cols-2
                    lg:grid-cols-3
                    gap-4
                    md:p-4
                ">
            {images().map((image, index) => (
              <div key={index}>
                <Image
                    src={"/images/" + image}
                    alt={image}
                    width='540'
                    height='400'
                    className="w-full h-auto rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Album;
