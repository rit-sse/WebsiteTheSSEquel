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
                    <img src='https://media.istockphoto.com/id/1392016982/photo/mixed-group-of-business-people-sitting-around-a-table-and-talking.jpg?s=612x612&w=0&k=20&c=d7mWQhdzKrowHYTWXXcCrNn02uyfLYQYB78M75G8lKg=' className="w-full" />
                    <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                    <a href="#slide4" className="btn btn-circle">❮</a> 
                    <a href="#slide2" className="btn btn-circle">❯</a>
                    </div>
                </div> 
            </div>
        </div>
      </section>
    </>
  );
}