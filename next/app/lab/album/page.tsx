import { Metadata } from "next";
import Image from 'next/image';
import ZCardContainer from "@/components/ZCardContainer";
import {AboutUsSlot} from "@/app/about/AboutUsSlot";
import images from "./AboutUsSlotContent";


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
          <h1>SSE Album</h1>
          <div className="subtitle-structure">
            <p>
              A collection of pictures taken in or for the SSE
            </p>
          </div>

          <ZCardContainer contentSlots={
            images().map(image => new AboutUsSlot(
                "/images/" + image, image.split(".")[0], "slot.description", "slot.alt"
            ))
          } />
        </div>
      </section>
    </>
  );
};

export default Lab;
