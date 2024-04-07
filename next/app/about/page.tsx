// This is the file that renders the /about route of the website.
import { Metadata } from "next";
import slotData from "./AboutUsSlotContent";
import ZCardContainer from "@/components/ZCardContainer";
import {AboutUsSlot} from "@/app/about/AboutUsSlot";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The Society of Software Engineers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const About = () => {
  return (
    <>
      <section>
        <div className="text-page-structure">
          <h1>About Us</h1>
          <div className="subtitle-structure">
            <p>
              The Society of Software Engineers at RIT fosters a vibrant community
              of tech enthusiasts, bridging academia with industry partnerships
              from giants like Microsoft to Apple, ensuring our members thrive in
              their future careers.
            </p>
          </div>

          <ZCardContainer contentSlots={
            slotData.map(slot => new AboutUsSlot(
                slot.imageSrc, slot.name, slot.description, slot.alt
            ))
          } />
        </div>
      </section>
    </>
  );
};

export default About;
