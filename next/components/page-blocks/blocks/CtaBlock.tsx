import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlockRenderProps } from "../types";

const VARIANT_CLASS: Record<string, string> = {
  orange: "bg-categorical-orange text-foreground hover:bg-categorical-orange/90",
  blue: "bg-categorical-blue text-foreground hover:bg-categorical-blue/90",
  pink: "bg-categorical-pink text-foreground hover:bg-categorical-pink/90",
  green: "bg-categorical-green text-foreground hover:bg-categorical-green/90",
  neutral: "bg-card text-foreground hover:bg-muted",
};

const ALIGN_CLASS: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export function CtaBlock({ props }: BlockRenderProps<"cta">) {
  return (
    <div className={["my-6 flex w-full", ALIGN_CLASS[props.align] ?? "justify-start"].join(" ")}>
      <Link
        href={props.href}
        className={[
          "inline-flex items-center gap-2 px-5 py-2.5 font-display font-semibold text-sm",
          "rounded-lg border-2 border-border transition-all",
          "neo:shadow-neo neo:hover:translate-x-[2px] neo:hover:translate-y-[2px] neo:hover:shadow-none",
          "clean:hover:scale-[1.02]",
          VARIANT_CLASS[props.variant] ?? VARIANT_CLASS.neutral,
        ].join(" ")}
      >
        {props.text}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
