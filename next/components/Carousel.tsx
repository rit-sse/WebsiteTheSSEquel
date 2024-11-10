// src/Carousel.js
"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  images: string[];
}

const Carousel = ({ images }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const imageHeight = 1;
  const imageWidth = 1200;
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
    <div className="carousel w-1200px rounded-[60px]">
      <div id="slide1" className="carousel-item relative w-full">
        <Image
          src="/kitty_cat_1.jpg"
          height={1}
          width={imageWidth}
          className="object-cover"
          alt="erm"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <Link href="#slide4" className="btn btn-circle">
            ❮
          </Link>
          <Link href="#slide2" className="btn btn-circle">
            ❯
          </Link>
        </div>
      </div>
      <div id="slide2" className="carousel-item relative w-full">
        <Image
          src="/kitty_cat_1.jpg"
          height={imageHeight}
          width={imageWidth}
          className="object-cover"
          alt="erm"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <Link href="#slide1" className="btn btn-circle">
            ❮
          </Link>
          <Link href="#slide3" className="btn btn-circle">
            ❯
          </Link>
        </div>
      </div>
      <div id="slide3" className="carousel-item relative w-full">
        <Image
          src="/kitty_cat_3.jpg"
          height={imageHeight}
          width={imageWidth}
          className="object-cover"
          alt="erm"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <Link href="#slide2" className="btn btn-circle">
            ❮
          </Link>
          <Link href="#slide4" className="btn btn-circle">
            ❯
          </Link>
        </div>
      </div>
      <div id="slide4" className="carousel-item relative w-full">
        <Image
          src="/kitty_cat_4.jpg"
          height={imageHeight}
          width={imageWidth}
          className="object-cover"
          alt="erm"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <Link href="#slide3" className="btn btn-circle">
            ❮
          </Link>
          <Link href="#slide1" className="btn btn-circle">
            ❯
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Carousel;
