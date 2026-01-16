// This is the file that renders the /about route of the website.
import { Metadata } from "next";
import slotData from "./AboutUsSlotContent";
import ZCardContainer from "@/components/ZCardContainer";
import {AboutUsSlot} from "@/app/about/AboutUsSlot";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The Society of Software Engineers is an academic organization at the Rochester Institute of Technology that provides mentoring and support for students in the Golisano College for Computing and Information Sciences.",
};

const About = () => {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-primary">About Us</h1>
            <p className="mt-4 text-lg max-w-3xl mx-auto">
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
        </Card>
      </div>
    </section>
  );
};

export default About;
