// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';
import HomepageContent from './HomepageContent';
import { DiscordIcon, InstagramIcon, SlackIcon, TikTokIcon, TwitchIcon } from '@/components/common/Icons';
import Link from 'next/link';

export default function Home() {
  const placeholder_w = 800;
  const placeholder_h = 800;

  const placeholder_img = (
    <Image
      src={`https://dummyimage.com/${placeholder_w}x${placeholder_h}`}
      alt="Placeholder"
      width={placeholder_w}
      height={placeholder_h}
      className="w-full h-auto rounded-[60px]"
    />
  )

  return (
    <>
      {/* Hero section */}
      <div className='my-auto flex flex-col md:flex-row items-center md:justify-evenly'>
        <div className="flex flex-col justify-center w-auto md:w-2/5">
          <h1 className='text-center md:text-left'>
            Society of
            <span className="block lg:inline"> Software Engineers </span>
          </h1>

          <p className="mx-auto mt-4 sm:text-xl/relaxed text-center md:text-left">
            {HomepageContent.description}
          </p>
          <p className='mt-4 font-bold text-center md:text-left'>
            {HomepageContent.weeklyMeetingCallout}
          </p>

          <div className="mt-8 flex flex-row flex-wrap gap-4 min-[460px]:flex-row justify-center md:justify-start">
            <CTAButton href={HomepageContent.slackLink} text="Join Slack" />
            <CTAButton href="/about/get-involved" text="Get Involved" />
          </div>
        </div>
        <div className='flex mt-12 md:mt-0 w-11/12 sm:w-2/5 justify-center'>
          {placeholder_img}
        </div>
      </div>
      {/* About Us Section */}
      {/* <div className='flex flex-col md:flex-row items-center md:justify-evenly md:mt-28'>
        <div className='flex mt-12 md:mt-0 w-11/12 sm:w-2/5 justify-center'>
          {placeholder_img}
        </div>
        <div className="flex flex-col justify-center w-auto md:w-2/5">
          <h1 className='text-center md:text-left mt-8 md:mt-0'>
            About Us
          </h1>

          <p className="mx-auto mt-4 text-lg/relaxed text-center md:text-left">
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
            Tess is Tech Head. Tess is Tech Head. Tess is Tech Head. Tess is Tech Head.
          </p>
        </div>
      </div> */}
    </>
  );
}