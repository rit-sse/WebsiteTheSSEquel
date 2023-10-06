// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root app directory.

import Image from 'next/image'

export default function Committees() {
  return (
    <>
      <section className="text-slate-200">
        <div className="flex flex-col md:flex-row">
            <div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex">
                <div className="text-center flex flex-col items-center w-full max-w-xl">
                    <h1
                    className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
                    >
                    Committees
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl sm:text-xl/relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>

                    {/* <div className="flex justify-center mt-4">
                    <CTAButton href="https://forms.gle/2HhKAsX91FLnzYGV7" text="Submit an Idea" />
                    </div> */}
                </div>
            </div>

            <div className="carousel flex flex-row w-full">
                <div id="slide1" className="carousel-item relative w-full sm:justify-center md:justify-left">
                    <img src='https://sse.rit.edu/assets/f59563ac4f3db9d4a392c37501414e4f.jpg' className="w-full h-full object-cover" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                      <a href="#slide3" className="btn btn-circle">❮</a>
                      <a href="#slide2" className="btn btn-circle">❯</a>
                    </div>
                </div>

                <div id="slide2" className="carousel-item relative w-full sm:justify-center md:justify-left">
                    <img src='https://www.rit.edu/sites/rit.edu/files/styles/news_spotlight/public/images/news-spotlight/legacy/2013-04-30.jpg?itok=mC5VHCHF' className="w-full h-full object-cover" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                      <a href="#slide1" className="btn btn-circle">❮</a>
                      <a href="#slide3" className="btn btn-circle">❯</a>
                    </div>
                </div>

                <div id="slide3" className="carousel-item relative w-full sm:justify-center md:justify-left">
                    <img src='https://www.rit.edu/sites/rit.edu/files/images/news-spotlight/legacy/2006-06-14.jpg' className="w-full h-full object-cover" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                      <a href="#slide2" className="btn btn-circle">❮</a>
                      <a href="#slide1" className="btn btn-circle">❯</a>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </>
  );
}