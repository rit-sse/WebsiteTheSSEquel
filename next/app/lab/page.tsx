// This is the file that renders the /lab route of the website.
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "The SSE Lab",
  description:
    "The Society of Software Engineers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const Lab = () => {
  return (
    <>
      <section>
        <div className="text-page-structure">
          <h1>The SSE Lab</h1>
          <div className="subtitle-structure">
            <p>
              The SSE Lab is located in room 1670 of the Golisano College of Computing and Information Sciences.
              The Lab is where our mentoring and events typically take place.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Lab;
