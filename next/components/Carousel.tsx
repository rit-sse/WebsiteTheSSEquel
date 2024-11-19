"use client";
import React, { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
}

const Carousel = ({ images }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const nextSlide = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  const prevSlide = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  if (images.length == 1) {
    return (
      <div className="carousel rounded-[60px]">
        <div className="carousel-item relative">
          <Image
            src={images[0]}
            width={2160}
            height={1440}
            className="object-cover w-[648px] h-[750px] md:w-[5000px] md:h-[700px]"
            alt={`image of me :]`}
          />
        </div>
      </div>
    );
  } else {
    return (
      /* Idk why i need to specify the width so many times for it to work but fuck it we ball */
      <div className="carousel rounded-[60px] w-[648px] md:w-full">
        <div className="carousel-item relative w-full">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {images.map((image, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <Image
                  src={image}
                  width={2160}
                  height={1440}
                  className="object-cover w-[648px] h-[750px] md:w-[5000px] md:h-[700px]"
                  alt={`image number ${activeIndex + 1} of me :]`}
                />
              </div>
            ))}
          </div>
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <button onClick={prevSlide} className="btn btn-circle">
              ❮
            </button>
            <button onClick={nextSlide} className="btn btn-circle">
              ❯
            </button>
          </div>
        </div>
      </div>
    );
  }
};
export default Carousel;
