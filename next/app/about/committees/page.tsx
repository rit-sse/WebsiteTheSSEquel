import ZCardContainer from '@/components/ZCardContainer';
import CommitteeSlotData from './CommitteeSlotData';
import { CommitteeSlot } from './CommitteeSlot';

export default function Committees() {
  return (
    <>
      <section>
        <div className="text-page-structure">
            <h1>Committees</h1>
            <div className="subtitle-structure">
              <p>
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
        </div>
      </section>
    </>
  );
}