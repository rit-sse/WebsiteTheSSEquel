"use client";

import { useCallback, useEffect, useRef } from "react";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import ImageCard from "@/components/ui/image-card";

const STORAGE_KEY = "sse:heroSlide";

const images = [
    { src: "/images/gen-meeting.jpg", alt: "SSE general meeting" },
    { src: "/images/events1.jpg", alt: "SSE event" },
    { src: "/images/group.jpg", alt: "SSE members at a meeting" },
];

export const HeroImage = () => {
    const apiRef = useRef<CarouselApi | null>(null);

    // Read saved slide index (fallback to 0)
    const getSaved = useCallback((): number => {
        try {
            const v = sessionStorage.getItem(STORAGE_KEY);
            return v ? parseInt(v, 10) || 0 : 0;
        } catch { return 0; }
    }, []);

    // When the carousel API is ready, jump to the saved slide and start listening
    const handleApi = useCallback((api: CarouselApi) => {
        if (!api) return;
        apiRef.current = api;

        const saved = getSaved();
        if (saved > 0 && saved < images.length) {
            api.scrollTo(saved, true); // instant jump, no animation
        }

        api.on("select", () => {
            try {
                sessionStorage.setItem(STORAGE_KEY, String(api.selectedScrollSnap()));
            } catch { /* ignore */ }
        });
    }, [getSaved]);

    // Start at the saved index so embla doesn't need to jump after mount
    const startIndex = typeof window !== "undefined" ? getSaved() : 0;

    return (
        <div className="flex mt-8 md:mt-0 w-full lg:w-[55%] justify-center">
            <Carousel
                className="w-full max-w-none group/carousel"
                opts={{ loop: true, startIndex }}
                setApi={handleApi}
            >
                <CarouselContent className="-ml-2">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="pl-2 pr-2 pb-2">
                            <ImageCard
                                imageUrl={image.src}
                                alt={image.alt}
                                priority={index === startIndex}
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
