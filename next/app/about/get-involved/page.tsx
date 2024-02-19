import ZCardContainer from '@/components/ZCardContainer';
import { CTAButton } from '@/components/common/CTAButton';
import Image from 'next/image'
import InvolvementSlotData from './InvolvementSlotData';
import { InvolvementSlot } from './InvolvementSlot'

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
                <div className="mx-auto max-w-screen-xl px-4 py-16 lg:flex">
                    <div className="text-center flex flex-col items-center w-full px-8 lg:max-w-6xl">
                        <h1 className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]">
                            Get Involved!
                        </h1>
                        {/* insert zcard here */}
                        <ZCardContainer contentSlots={
                            InvolvementSlotData.map(
                                data => new InvolvementSlot(
                                    data.imageSrc, data.title, data.body
                                )
                            )
                        } />
                    </div>
                </div>
            </section>
        </>

    )
}