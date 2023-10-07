// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root app directory.

import Image from 'next/image'
// Initialization for ES Users
import Collapse from 'daisyui';


export default function Committees() {
  return (
    <>
      <section className="text-slate-200">
        <div className="flex flex-col py-16 lg:flex-row">
            <div className="carousel flex flex-row w-full max-w-100 max-h-96">
                <div id="slide1" className="carousel-item relative w-full sm:justify-center md:justify-left">
                    <img src='https://sse.rit.edu/assets/f59563ac4f3db9d4a392c37501414e4f.jpg' className="max-w-full max-h-full object-cover" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                      <a href="#slide3" className="btn btn-circle">❮</a>
                      <a href="#slide2" className="btn btn-circle">❯</a>
                    </div>
                </div>

                <div id="slide2" className="carousel-item relative w-full sm:justify-center md:justify-left">
                    <img src='https://www.rit.edu/sites/rit.edu/files/styles/news_spotlight/public/images/news-spotlight/legacy/2013-04-30.jpg?itok=mC5VHCHF' className="max-w-full max-h-full object-cover" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                      <a href="#slide1" className="btn btn-circle">❮</a>
                      <a href="#slide3" className="btn btn-circle">❯</a>
                    </div>
                </div>

                <div id="slide3" className="carousel-item relative w-full sm:justify-center md:justify-left">
                    <img src='https://www.rit.edu/sites/rit.edu/files/images/news-spotlight/legacy/2006-06-14.jpg' className="max-w-full max-h-full object-cover" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                      <a href="#slide2" className="btn btn-circle">❮</a>
                      <a href="#slide1" className="btn btn-circle">❯</a>
                    </div>
                </div>
            </div>
            
            <div className="mx-auto max-w-screen-xl pl-4 pr-4 py-16 lg:flex lg:pl-16 lg:pr-32">
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
        </div>

        <div className="text-left flex flex-col items-left px-4 w-full max-w-full">
          <h2
          className="text-white bg-clip-text
                      text-3xl/[3rem] font-bold text-transparent sm:text-1xl/[4rem]"
          >
          Events
          </h2>

          <h3 className="mt-4 pl-4 max-w-2xl text-bold sm:text-xl/relaxed">
            Committee Head: Adam Gilbert<br />
            Email: aeg1276@rit.edu

          </h3>

          <p className="mt-4 pl-4 max-w-2xl pb-4 sm:text-xl/relaxed">
              This is a description of the committee. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>

          {/* <div className="flex justify-center mt-4">
          <CTAButton href="https://forms.gle/2HhKAsX91FLnzYGV7" text="Submit an Idea" />
          </div> */}
        </div>
      </section>
    </>
  );
}