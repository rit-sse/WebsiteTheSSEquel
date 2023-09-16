import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';

export default function Home() {
  return (
    <>
      <section className="text-slate-200">
        <div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex">
          <div className="text-center flex flex-col items-center w-full max-w-xl">
            <h1
              className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                         text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
            >
              Society of
              <span className="sm:block"> Software Engineers </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl sm:text-xl/relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>

            <div className="mt-8 flex flex-col flex-wrap justify-center gap-4 min-[460px]:flex-row">
              <CTAButton href="https://rit-sse.slack.com/" text="Join our Slack" />
            </div>

            {/* <div className="flex justify-center mt-4">
              <CTAButton href="https://forms.gle/2HhKAsX91FLnzYGV7" text="Submit an Idea" />
            </div> */}
          </div>
        </div>
      </section>
    </>
  );
}