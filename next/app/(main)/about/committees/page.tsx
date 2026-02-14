import ZCardContainer from '@/components/ZCardContainer';
import { CommitteeSlot } from './CommitteeSlot';
import { Card } from "@/components/ui/card";
import { getCommitteeSlots } from '@/lib/cmsContent';

export default async function Committees() {
  const { introText, committees: committeeSlotData } = await getCommitteeSlots();

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-primary">Committees</h1>
            <p className="mt-4 text-lg max-w-3xl mx-auto">
              {introText}
            </p>
          </div>
          
          <ZCardContainer contentSlots={
            committeeSlotData.map(
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