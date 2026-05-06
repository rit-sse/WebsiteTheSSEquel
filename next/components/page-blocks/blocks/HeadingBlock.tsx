import type { BlockRenderProps } from "../types";

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const LEVEL_CLASS: Record<number, string> = {
  1: "font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
  2: "font-display text-3xl md:text-4xl font-bold tracking-tight",
  3: "font-display text-2xl md:text-3xl font-semibold tracking-tight",
  4: "font-display text-xl md:text-2xl font-semibold tracking-tight",
};

export function HeadingBlock({ props }: BlockRenderProps<"heading">) {
  const Tag = `h${props.level}` as "h1" | "h2" | "h3" | "h4";
  const accent = props.accent === "primary" ? "text-primary" : "";
  return (
    <Tag
      className={[
        "mb-3 mt-8 first:mt-0 scroll-mt-24",
        LEVEL_CLASS[props.level] ?? LEVEL_CLASS[2],
        ALIGN_CLASS[props.align] ?? "text-left",
        accent,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.text}
    </Tag>
  );
}
