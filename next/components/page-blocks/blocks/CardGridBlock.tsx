import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BlockRenderProps } from "../types";

const ACCENT_CLASSES = {
  orange: "border-categorical-orange/80 bg-categorical-orange/10",
  blue: "border-categorical-blue/80 bg-categorical-blue/10",
  pink: "border-categorical-pink/80 bg-categorical-pink/10",
  green: "border-categorical-green/80 bg-categorical-green/10",
  neutral: "border-border bg-surface-2",
} as const;

export function CardGridBlock({ props }: BlockRenderProps<"cardGrid">) {
  const columns = Math.min(Math.max(props.columns, 1), 4);
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section className="my-8">
      {props.heading && (
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
          {props.heading}
        </h2>
      )}
      <div className={cn("grid items-stretch gap-4", gridClass)}>
        {props.items.map((item, i) => {
          const content = (
            <Card
              depth={2}
              className={cn(
                "flex h-full min-h-[10rem] flex-col justify-between border-2 p-5 transition-colors",
                item.href && "hover:bg-surface-1 hover:shadow-md",
                ACCENT_CLASSES[item.accent],
              )}
            >
              <div>
                <h3 className="font-display text-xl font-bold leading-tight tracking-tight">
                  {item.title}
                </h3>
                {item.body && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                    {item.body}
                  </p>
                )}
              </div>
              {item.href && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                  {item.ctaText || "Open"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Card>
          );

          if (!item.href) {
            return <div key={i}>{content}</div>;
          }

          return (
            <Link key={i} href={item.href} className="block h-full">
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
