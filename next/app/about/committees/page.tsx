import Image from 'next/image'
import ZCardContainer from '@/components/ZCardContainer';
import CommitteeSlotData from './CommitteeSlotData';
import { ZCardContent } from '@/types/ZCardContent';
import { CommitteeSlot } from './CommitteeSlot';

export default function Committees() {
  return (
    <>
      <section>
        <div className="flex flex-col items-center max-w-screen-xl">            
            <div className="mx-auto px-4 sm: py-16 md:pb-8 max-w-2xl">
                <div className="text-center flex flex-col items-center w-full">
                    <h1
                    className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                    >
                    Committees
                    </h1>

                    <p className="mx-auto mt-4 text-xl/relaxed">
                    The Society of Software Engineers delegates responsibility for tasks with committees. These
                    committees play pivotal roles in organizing events, facilitating projects, providing platforms for
                    knowledge exchange, and more. Together we create opportunities for members to connect,
                    collaborate, and learn from one another.

                    </p>
                </div>
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