"use client";
import React, { useState } from "react";
import Image from "next/image";


interface Props {
  images: string[];
}

const NewCarousel = ({ images }: Props) => {
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
  return (
    <div className="carousel rounded-[60px]">
      <div className="carousel-item relative w-full">
        <Image
          src={images[activeIndex]}
          width={5000}
          height={3000}
          className="object-cover w-[648px] md:w-[5000px] md:h-[700px]"
        alt={`image ${activeIndex}`}
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
};
export default NewCarousel;
