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
            width={5000}
            height={3000}
            className="object-cover fixed-w-[648px] h-[750px] md:w-[5000px] md:h-[700px]"
            alt={`image of me :]`}
          />
        </div>
      </div>
    );
  } else {
    return (
      <div className="carousel rounded-[60px] w-[648px] md:w-[5000px]">
        <div className="carousel-item relative w-full">
          <Image
            src={images[activeIndex]}
            width={5000}
            height={3000}
            className="object-cover w-[648px] h-[750px] md:w-[5000px] md:h-[700px]"
            alt={`image number ${activeIndex + 1} of me :]`}
          />
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