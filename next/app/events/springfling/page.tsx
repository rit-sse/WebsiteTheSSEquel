import { Metadata } from "next";
import slotData from "././SpringflingSlotData";
import ZCardContainer from "@/components/ZCardContainer";
import {SpringflingSlot} from "@/app/events/springfling/SpringflingSlot";

export const metadata: Metadata = {
  title: "Spring Fling",
  description:
    "PLACEHOLDER TEXT.",
};

const springFling = () => {
  return (
    <>
      <section>
        <div className="text-page-structure">
          <h1>Spring Fling</h1>
          <div className="subtitle-structure">
            <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. Ut enim ad minim veniam.
            </p>
          </div>

          <ZCardContainer contentSlots={
            slotData.map(slot => new SpringflingSlot(
                slot.imageSrc, slot.name, slot.description, slot.alt
            ))
          } />
        </div>
      </section>
    </>
  );
};

export default springFling;
