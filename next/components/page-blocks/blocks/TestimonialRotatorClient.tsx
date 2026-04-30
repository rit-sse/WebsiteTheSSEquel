"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Quote as QuoteIcon } from "lucide-react";

interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
}

interface Props {
  pool: TestimonialItem[];
  count: number;
  intervalMs: number;
}

/**
 * Slow crossfade through a randomized window of testimonials. Initial
 * paint is stable (first N) so SSR matches; the shuffle happens after
 * hydration in a useEffect.
 */
export function TestimonialRotatorClient({ pool, count, intervalMs }: Props) {
  const reduced = useReducedMotion();
  const initial = useMemo(() => pool.slice(0, count), [pool, count]);
  const [picks, setPicks] = useState<TestimonialItem[]>(initial);
  const [active, setActive] = useState(0);
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (pool.length <= count) {
        setPicks(shuffle(pool));
        return;
      }
      const offset = Math.floor(Math.random() * (pool.length - count + 1));
      setPicks(shuffle(pool.slice(offset, offset + count)));
    });
    return () => {
      cancelled = true;
    };
  }, [pool, count]);

  useEffect(() => {
    function onVis() {
      setHidden(document.hidden);
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (reduced || hidden || picks.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActive((i) => (i + 1) % picks.length);
    }, intervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [reduced, hidden, picks.length, intervalMs]);

  if (picks.length === 0) return null;
  const current = picks[active]!;

  return (
    <figure className="relative mx-auto max-w-3xl rounded-2xl border-2 border-border bg-card px-6 py-10 md:px-12 md:py-14 neo:shadow-neo overflow-hidden">
      <QuoteIcon
        className="absolute left-6 top-6 h-10 w-10 text-categorical-orange opacity-30"
        aria-hidden
      />
      <div className="relative min-h-[8rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <blockquote className="font-display text-xl md:text-2xl leading-relaxed font-medium text-balance">
              &ldquo;{current.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-sm uppercase tracking-[0.18em] text-muted-foreground">
              — {current.author}
            </figcaption>
          </motion.div>
        </AnimatePresence>
      </div>

      {picks.length > 1 && (
        <div className="mt-6 flex justify-center gap-1.5" role="tablist">
          {picks.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Testimonial ${i + 1} of ${picks.length}`}
              onClick={() => setActive(i)}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/30 hover:bg-foreground/60",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </figure>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
