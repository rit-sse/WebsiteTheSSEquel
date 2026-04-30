import prisma from "@/lib/prisma";
import type { BlockRenderProps } from "../types";
import { TestimonialRotatorClient } from "./TestimonialRotatorClient";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
}

/**
 * TestimonialRotatorBlock — pulls Quote rows + Alumni.quote and rotates
 * through them. Server fetches the pool; client picks a random window
 * and rotates through it with a slow crossfade.
 */
export async function TestimonialRotatorBlock({
  props,
}: BlockRenderProps<"testimonialRotator">) {
  const sources = new Set(props.sources);
  const pool: Testimonial[] = [];

  if (sources.has("quotes")) {
    const quotes = await prisma.quote.findMany({
      orderBy: { date_added: "desc" },
      take: 50,
      select: { id: true, quote: true, author: true },
    });
    for (const q of quotes) {
      pool.push({ id: `q${q.id}`, quote: q.quote, author: q.author });
    }
  }
  if (sources.has("alumni")) {
    const alumni = await prisma.alumni.findMany({
      where: { quote: { not: "" } },
      orderBy: { id: "desc" },
      take: 50,
      select: { id: true, name: true, quote: true },
    });
    for (const a of alumni) {
      if (a.quote.trim()) {
        pool.push({ id: `a${a.id}`, quote: a.quote, author: a.name });
      }
    }
  }

  if (pool.length === 0) {
    return (
      <div className="my-8 rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
        No testimonials available yet.
      </div>
    );
  }

  return (
    <section className="my-10">
      <TestimonialRotatorClient
        pool={pool}
        count={Math.min(props.count, pool.length)}
        intervalMs={props.intervalMs}
      />
    </section>
  );
}
