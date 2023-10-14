import { CTAButton } from '@/components/common/CTAButton';

export default function GetInvolved() {
    return (
        <>
            <section className="text-slate-200">
                <div className="text-center flex flex-col items-center w-full max-w-xl">
                        <h1 className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                         text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]">
                        <span className="sm:block">Get Involved</span>
                    </h1>
                </div>
            </section>
            {/* div around c and para classname=flex side by side */}
            <div className="flex flex-row">


            <div className="carousel w-full max-w-md">
                <div id="slide1" className="carousel-item relative w-full">
                    <img src="https://cdn.rit.edu/images/facility/SeCollaborationLab.jpg" className="w-full" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                        <a href="#slide4" className="btn btn-circle">❮</a>
                        <a href="#slide2" className="btn btn-circle">❯</a>
                    </div>
                </div>
                <div id="slide2" className="carousel-item relative w-full">
                    <img src="https://cdn.rit.edu/images/facility/SeCollaborationLab.jpg" className="w-full" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                        <a href="#slide1" className="btn btn-circle">❮</a>
                        <a href="#slide3" className="btn btn-circle">❯</a>
                    </div>
                </div>
                <div id="slide3" className="carousel-item relative w-full">
                    <img src="https://cdn.rit.edu/images/facility/SeCollaborationLab.jpg" className="w-full" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                        <a href="#slide2" className="btn btn-circle">❮</a>
                        <a href="#slide4" className="btn btn-circle">❯</a>
                    </div>
                </div>
                <div id="slide4" className="carousel-item relative w-full">
                    <img src="https://cdn.rit.edu/images/facility/SeCollaborationLab.jpg" className="w-full" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                        <a href="#slide3" className="btn btn-circle">❮</a>
                        <a href="#slide1" className="btn btn-circle">❯</a>
                    </div>
                </div>
            </div>
            <section>
                <div className='mb-3 text-gray-500 dark:text-gray-400'>
                    <p className="mx-auto mt-4 max-w-2xl sm:text-xl/relaxed px-5">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                </div>
            </section>
            </div>

            <section className="pt-6">
                <div className="text-left space-x-5 mt-3 flex">
                    <h2 className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                         text-3xl/[3rem] font-extrabold text-transparent sm:text-3xl/[3rem]">COME TO OUR EVENTS!</h2>
                    <CTAButton href="http://localhost:3000/events" text="Events" />
                </div>
            </section>
            <section className="pt-6">
                <div className="text-left space-x-5 mt-3 flex">
                    <h2 className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                         text-3xl/[3rem] font-extrabold text-transparent sm:text-3xl/[3rem]">TALK TO US!</h2>
                    <CTAButton href="https://rit-sse.slack.com/" text="Join our Slack" />
                </div>
            </section>
        </>

    )
}