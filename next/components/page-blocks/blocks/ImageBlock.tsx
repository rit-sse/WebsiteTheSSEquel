import Image from "next/image";
import type { BlockRenderProps } from "../types";

const FRACTION_CLASS: Record<string, string> = {
  "1": "w-full",
  "0.66": "w-full md:w-2/3 mx-auto",
  "0.5": "w-full md:w-1/2 mx-auto",
  "0.33": "w-full md:w-1/3 mx-auto",
};

function fractionClass(fraction: number) {
  const key = String(fraction);
  return FRACTION_CLASS[key] ?? "w-full";
}

export function ImageBlock({ props }: BlockRenderProps<"image">) {
  if (!props.src) return null;
  return (
    <figure className={["my-6", fractionClass(props.widthFraction)].join(" ")}>
      <div
        className={[
          "relative w-full overflow-hidden",
          props.rounded ? "rounded-lg" : "",
        ].join(" ")}
        style={{ paddingBottom: "56.25%" }}
      >
        <Image
          src={props.src}
          alt={props.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      </div>
      {props.caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground italic">
          {props.caption}
        </figcaption>
      )}
    </figure>
  );
}
