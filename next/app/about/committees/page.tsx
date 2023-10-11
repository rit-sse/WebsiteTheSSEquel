// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root app directory.

import Image from 'next/image'
// Initialization for ES Users
import { Children } from 'react';

const ZCard: React.FC<{
  image: 'left' | 'right';
  children: React.ReactNode;
}> = ({ image, children }) => {
  const [left, right, ...rest] = Children.toArray(children);

  if (rest.length > 0) throw new Error("ZCard can only have two children");

  const classLeft = image === 'left' ? "w-full md:w-1/3" : "w-full md:w-2/3";
  const classRight = image === 'right' ? "w-full md:w-1/3" : "w-full md:w-2/3";
  const flexDirection = image === 'left' ? 'flex-col md:flex-row' : 'flex-col-reverse md:flex-row';

  return (
    <div className={`flex ${flexDirection} items-center gap-24 gap-y-0`}>
      <div className={classLeft}>{left}</div>
      <div className={classRight}>{right}</div>
    </div>
  );
};

export default function Committees() {
  const placeholder_w = 540;
  const placeholder_h = 400;

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
      <section className="text-slate-200">
        <div className="flex flex-col items-center max-w-screen-xl">            
            <div className="mx-auto px-4 sm: py-16 md:pb-8 max-w-2xl">
                <div className="text-center flex flex-col items-center w-full">
                    <h1
                    className="bg-gradient-to-r from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                    >
                    Committees
                    </h1>

                    <p className="mx-auto mt-4 text-xl/relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                </div>
            </div>

            <div id='Committee Slots' className='pt-4'>
              <ZCard image='left'>
                {placeholder_img}
                <div className='text-left pt-4 pb-32 md:py-16'>
                  <h2
                  className="text-white bg-clip-text
                               font-bold text-transparent text-3xl/[3rem]"
                  >
                  Events
                  </h2>

                  <p className="mt-4 pb-4 text-xl/relaxed">
                  This is a description of the committee. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                  sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                  porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                  Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                  Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.
                  </p>
                </div>
              </ZCard>

              <ZCard image='right'>
                <div className='text-right pt-4 pb-32 md:py-16'>
                  <h2
                  className="text-white bg-clip-text
                              text-3xl/[3rem] font-bold text-transparent sm:text-1xl/[4rem]"
                  >
                  Talks
                  </h2>

                  <p className="mt-4 pb-4 text-xl/relaxed">
                  This is a description of the committee. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                  sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                  porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                  Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                  Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.
                  </p>
                </div>
                {placeholder_img}
              </ZCard>

              <ZCard image='left'>
                {placeholder_img}
                <div className='text-left pt-4 pb-32 md:py-16'>
                  <h2
                  className="text-white bg-clip-text
                               font-bold text-transparent text-3xl/[3rem]"
                  >
                  Projects
                  </h2>

                  <p className="mt-4 pb-4 text-xl/relaxed sm:pb-0">
                  This is a description of the committee. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                  sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                  porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                  Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                  Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.
                  </p>
                </div>
              </ZCard>
            </div>
        </div>
      </section>
    </>
  );
}