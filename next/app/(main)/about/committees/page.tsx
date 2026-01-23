import ZCardContainer from '@/components/ZCardContainer';
import CommitteeSlotData from './CommitteeSlotData';
import { CommitteeSlot } from './CommitteeSlot';
import { Card } from "@/components/ui/card";

export default function Committees() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-primary">Committees</h1>
            <p className="mt-4 text-lg max-w-3xl mx-auto">
              The Society of Software Engineers delegates responsibility for tasks with committees. These
              committees play pivotal roles in organizing events, facilitating projects, providing platforms for
              knowledge exchange, and more. Together we create opportunities for members to connect,
              collaborate, and learn from one another.
            </p>
          </div>
          
          <ZCardContainer contentSlots={
            CommitteeSlotData.map(
              data => new CommitteeSlot(
                data.imageSrc, data.name, data.description
              )
            )
          }/>
        </Card>
      </div>
    </section>
  );
}