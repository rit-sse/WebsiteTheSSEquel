import { CTAButton } from '@/components/common/CTAButton';

export default function GetInvolved() {
    return (
        <>
            <section className="text-slate-200">
                <div className="text-center flex flex-col items-center w-full max-w-xl">
                    <h1 className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                         text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]">
                            <span className="sm:block">Get Involved</span>
                    </h1>
                </div>
            </section>

            <section className ="">
                <div className="text-left space-x-5 mt-3 flex">

                <h2 className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                         text-3xl/[3rem] font-extrabold text-transparent sm:text-3xl/[3rem]">TALK TO US!</h2>
                <CTAButton href="https://rit-sse.slack.com/" text="Join our Slack" />

                </div>
            </section>
        </>
    )
}