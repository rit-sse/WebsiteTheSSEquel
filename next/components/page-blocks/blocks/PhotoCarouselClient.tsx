"use client";

/**
 * PhotoCarouselClient
 *
 * Crossfade through a window of photos pulled from a category pool.
 *
 * Why client-side, not server: we want different visitors and different
 * page loads to see different photos so the site feels alive. Doing
 * this on the server would either defeat caching (random in render →
 * different output every request) or produce SSR/CSR mismatches. The
 * fix: server returns a stable cached pool ordered newest-first, the
 * client shuffles after hydration in `useEffect`.
 *
 * Initial render shows the first `count` photos in stable order — no
 * hydration mismatch. After mount, we shuffle once if `order=random`
 * and then start the auto-advance timer. Pause on `document.hidden`
 * to spare mobile batteries. Honor `prefers-reduced-motion` by
 * skipping the auto-advance entirely.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { PhotoPoolItem } from "@/lib/pageBuilder/photoPool";

interface Props {
  pool: PhotoPoolItem[];
  count: number;
  intervalMs: number;
  showCaptions: boolean;
  order: "random" | "newest";
}

export function PhotoCarouselClient({
  pool,
  count,
  intervalMs,
  showCaptions,
  order,
}: Props) {
  const reduced = useReducedMotion();

  // Initial pick is deterministic (first N) so SSR and first client
  // paint match exactly.
  const initialPick = useMemo(() => pool.slice(0, count), [pool, count]);
  const [picks, setPicks] = useState<PhotoPoolItem[]>(initialPick);
  const [active, setActive] = useState(0);
  const [hidden, setHidden] = useState(false);

  // After hydration, optionally shuffle the visible window. We pick a
  // random starting offset and then a random permutation of `count`
  // photos so the same cache-hit pool produces different visible
  // sequences per visit. The randomness must run client-side after
  // hydration to avoid SSR/CSR mismatches; using a microtask so the
  // setState lands outside the effect body keeps React 19 happy with
  // `react-hooks/set-state-in-effect`.
  useEffect(() => {
    if (order === "newest") return;
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
  }, [order, pool, count]);

  // Pause auto-advance when tab is backgrounded — keeps mobile cool.
  useEffect(() => {
    function onVis() {
      setHidden(document.hidden);
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Auto-advance timer.
  const lastTickRef = useRef(0);
  useEffect(() => {
    if (reduced || hidden || picks.length <= 1) return;
    const id = window.setInterval(() => {
      lastTickRef.current = Date.now();
      setActive((prev) => (prev + 1) % picks.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reduced, hidden, picks.length, intervalMs]);

  if (picks.length === 0) return null;

  // Single-photo: just render it, no animation.
  if (picks.length === 1) {
    const p = picks[0]!;
    return (
      <div className="absolute inset-0">
        <Image
          src={p.imageUrl}
          alt={p.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
          priority
        />
        {showCaptions && p.caption && <CaptionPlate text={p.caption} />}
      </div>
    );
  }

  return (
    <>
      {picks.map((photo, i) => {
        const isActive = i === active;
        return (
          <motion.div
            key={photo.id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }
            }
            // Defensive against motion bugs: keep the inactive layers
            // behind the active one so click events go to the right
            // spot if we ever add interactivity.
            style={{ zIndex: isActive ? 2 : 1 }}
            aria-hidden={!isActive}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority={i === 0}
            />
            {showCaptions && photo.caption && isActive && <CaptionPlate text={photo.caption} />}
          </motion.div>
        );
      })}

      {/* Pagination dots — also serve as a visual rhythm cue. */}
      <div
        className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
        role="tablist"
        aria-label="Photo carousel"
      >
        {picks.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Show photo ${i + 1} of ${picks.length}`}
            onClick={() => setActive(i)}
            className={[
              "h-1.5 rounded-full transition-all duration-300",
              i === active
                ? "w-6 bg-white shadow-sm"
                : "w-1.5 bg-white/55 hover:bg-white/80",
            ].join(" ")}
          />
        ))}
      </div>
    </>
  );
}

function CaptionPlate({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-10 pt-8">
      <p className="font-display text-sm font-medium text-white/95 md:text-base">{text}</p>
    </div>
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
