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
                <div className="flex flex-col items-center w-full max-w-xl">
                    <div className="mx-auto px-4 sm: py-16 md:pb-8 max-w-2xl">

                        <div className="text-center flex flex-col items-center w-full">

                            <h1 className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]">
                                Get Involved!
                            </h1>

                            <p className="mx-auto mt-4 text-xl/relaxed text-justify indent-20">
                                {/* A great way to get involved is by being on this page! There are many ways to get involved
                                whether you are a computing major or non computing major. This can range from going to general
                                meetings to participating in projects or you can even start a project of your own! Simply walking
                                into the lab and sitting in on a general meeting to understand what is happening is a great way to
                                start. This provides an opportunity to gain insights into our ongoing activities and operations,
                                allowing you to assess potential areas of interest for your engagement. Please feel free to stop by
                                for a meeting every Friday at 3:00 PM in GOL-1670. */}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* div around c and para classname=flex side by side */}

            {/* insert zcard here */}
            <ZCardContainer contentSlots={
                InvolvementSlotData.map(
                    data => new InvolvementSlot(
                        data.imageSrc, data.title, data.body
                    )
                )
            }/>

            {/* Buttons to press on */}
            <section className="pt-6">
                <div className="text-left space-x-5 mt-3 flex">
                    <h2 className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                         text-3xl/[3rem] font-extrabold text-transparent sm:text-3xl/[3rem]">COME TO OUR EVENTS!</h2>
                    <CTAButton href="http://localhost:3000/events" text="Events" />
                </div>
            </section>
            <section className="pt-6">
                <div className="text-left space-x-5 mt-3 flex">
                    <h2 className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                         text-3xl/[3rem] font-extrabold text-transparent sm:text-3xl/[3rem]">TALK TO US!</h2>
                    <CTAButton href="https://rit-sse.slack.com/" text="Join our Slack" />
                </div>
            </section>
        </>

    )
}