import ZCardContainer from '@/components/ZCardContainer';
import Image from 'next/image'
import InvolvementSlotData from './InvolvementSlotData';
import { InvolvementSlot } from './InvolvementSlot'
import { GetInvolvedCTAs } from './GetInvolvedCTAs'

export default function GetInvolved() {
    // The default height and width for the placeholder dummy photo
    const placeholder_w = 540;
    const placeholder_h = 400;

    // the image being used in all ZCards currently
    const placeholder_img = (
        <Image
            src={`https://dummyimage.com/${placeholder_w}x${placeholder_h}`}
            alt="Placeholder"
            width={placeholder_w}
            height={placeholder_h}
            className="w-full h-auto rounded-md"
        />
    );

    return (
        <>
            <section>
                <div className="text-page-structure">
                    <h1>Get Involved!</h1>
                    <div className='subtitle-structure'>
                        <p>
                            Are you ready to make an impact? Dive in the heart of the SSE and become part of a vibrant community dedicated to innnovation and collaboration. Whether you are passionate about coding, organizing events, or fostering connections, there is a place for you here. Join us in shaping the future of the SSE as we work together to create meaningful opportunities for growth, learning, and impact. Let&apos;s build something incredible together.
                        </p>
                    </div>

                    <ZCardContainer contentSlots={
                        InvolvementSlotData.map(
                            data => new InvolvementSlot(
                                data.imageSrc, data.title, data.body
                            )
                        )
                    }/>

                      <GetInvolvedCTAs />
                   </div>
            </section>
        </>

    )
}