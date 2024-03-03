// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';
import HomepageContent from './HomepageContent';
import { DiscordIcon, InstagramIcon, SlackIcon, TikTokIcon, TwitchIcon } from '@/components/common/Icons';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <section className="text-base-content">
        <div className="mx-auto max-w-screen-xl px-4 pt-16 lg:flex">
          <div className="text-center flex flex-col items-center w-full max-w-4xl">
            <h1>
              Society of
              <span className="block lg:inline"> Software Engineers </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl sm:text-xl/relaxed text-center">
              {HomepageContent.description}
            </p>
            <p className='mt-4 font-bold text-center'>
              {HomepageContent.weeklyMeetingCallout}
            </p>

            <div className="mt-8 flex flex-row flex-wrap justify-center items-center gap-4 min-[460px]:flex-row">
              <CTAButton href={HomepageContent.slackLink} text="Join Slack" />
              <CTAButton href="/about/get-involved" text="Get Involved" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}