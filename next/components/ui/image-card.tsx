"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  imageUrl: string;
  alt?: string;
  caption?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  disableHover?: boolean;
  depth?: 1 | 2 | 3;
}

const depthClasses = {
  1: "bg-surface-1",
  2: "bg-surface-2",
  3: "bg-surface-3",
};

const ImageCard = ({
  imageUrl,
  alt,
  caption,
  className,
  imageClassName,
  priority,
  disableHover = false,
  depth = 2,
}: ImageCardProps) => {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border-2 border-black",
        depthClasses[depth],
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        !disableHover && [
          "transition-all duration-150",
          "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
          "group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none",
        ],
        className
      )}
    >
      <div className="relative w-full aspect-[4/3]">
        <Image
          src={imageUrl}
          alt={alt ?? caption ?? "Image"}
          fill
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      </div>
      {caption ? (
        <figcaption className="border-t-2 border-black px-4 py-3 font-display text-lg text-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
};

export default ImageCard;
