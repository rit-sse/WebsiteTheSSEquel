import { CTAButton } from '@/components/common/CTAButton';
import Image from 'next/image'
import ZCard from './ZCard';
import CommitteeSlot from '../committees/CommitteeSlot';

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

            <div id='general' className='pt-4'>
                <ZCard imageSide='left'>
                    {placeholder_img}
                    <CommitteeSlot
                        name='General Meeting'
                        description='A great way to get involved is by being on this page! There are many ways to get involved
                        whether you are a computing major or non computing major. This can range from going to general
                        meetings to participating in projects or you can even start a project of your own! Simply walking
                        into the lab and sitting in on a general meeting to understand what is happening is a great way to
                        start. This provides an opportunity to gain insights into our ongoing activities and operations,
                        allowing you to assess potential areas of interest for your engagement. Please feel free to stop by
                        for a meeting every Friday at 3:00 PM in GOL-1670.'
                    />
                </ZCard>
            </div>
            <div id='involvement' className='pt-4'>
                <ZCard imageSide='right'>
                    <CommitteeSlot
                        name='Mentoring'
                        description="If you have any questions about anything that is related to software engineering, 
                        computer science, computational mathematics, or game design please feel free to come talk to walk 
                        right in and ask one one of our mentors. Mentoring is open Monday to Friday from 10AM to 6PM. You 
                        can check out the mentoring schedule of the times for each mentor. However, if you would like to apply 
                        to help out as a member, please reach out to our Mentoring Head, Eloise Christian."
                  />
                {placeholder_img}
              </ZCard>

              <ZCard imageSide='left'>
                    {placeholder_img}
                    <CommitteeSlot
                        name='Talks'
                        description='We dont always talk about computing related topics, we often delve into diverse topics, such as 
                        the amusing appearances of various aquatic creatures. Our enthusiasm for this particular subject matter has led 
                        to the establishment of Funny Fish Friday, a designated day for engaging in lively conversations about these quirky 
                        aquatic beings". If you would like to give a talk of your own please reach out to our Talk Head, Tess Hacker.'
                    />
                </ZCard>

                <ZCard imageSide='right'>
                    <CommitteeSlot
                        name='Cleaning'
                        description='With all this happening, the lab can get a bit messy. 
                        This is a great opportunity to gain membership here by participating 
                        in lab cleanup sessions!'
                    />
                    {placeholder_img}
                </ZCard>
            </div>
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