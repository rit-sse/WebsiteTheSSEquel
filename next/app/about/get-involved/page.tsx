import { CTAButton } from '@/components/common/CTAButton';
import Image from 'next/image'
import ZCard from './ZCard';

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
                    <h1 className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                         text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]">
                        <span className="sm:block">Get Involved</span>
                    </h1>
                </div>
            </section>
            {/* div around c and para classname=flex side by side */}

            {/* insert zcard here */}











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