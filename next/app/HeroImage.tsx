"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import ImageCard from "@/components/ui/image-card";

const images = [
    { src: "/images/group.jpg", alt: "SSE members at a meeting" },
    { src: "/images/gen-meeting.jpg", alt: "SSE general meeting" },
    { src: "/images/mentoring.jpg", alt: "SSE mentoring session" },
];

export const HeroImage = () => {
    return (
        <div className="flex mt-8 md:mt-0 w-full lg:w-[55%] justify-center">
            <Carousel className="w-full max-w-none group/carousel" opts={{ loop: true }}>
                <CarouselContent className="-ml-2">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="pl-2 pr-2 pb-2">
                            <ImageCard
                                imageUrl={image.src}
                                alt={image.alt}
                                priority={index === 0}
                                className="w-full"
                                disableHover
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                <CarouselNext className="right-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
            </Carousel>
        </div>
    );
};
