import { Metadata } from "next";
import slotData from "././WinterballSlotData";
import ZCardContainer from "@/components/ZCardContainer";
import {WinterballSlot} from "@/app/events/winterball/WinterballSlot";

export const metadata: Metadata = {
  title: "Winter Ball",
  description:
    "PLACEHOLDER TEXT.",
};

const winterBall = () => {
  return (
    <>
      <section>
        <div className="text-page-structure">
          <h1>Winter Ball</h1>
          <div className="subtitle-structure">
            <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. Ut enim ad minim veniam.
            </p>
          </div>

          <ZCardContainer contentSlots={
            slotData.map(slot => new WinterballSlot(
                slot.imageSrc, slot.name, slot.description, slot.alt
            ))
          } />
        </div>
      </section>
    </>
  );
};

export default winterBall;
