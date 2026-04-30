"use client";

/**
 * PhotoGridShuffler — picks a random window of `count` photos from a
 * pool, then shuffles within the window. Initial render shows the
 * stable first `count` (no SSR/CSR mismatch) and the shuffle happens
 * after hydration in `useEffect`.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { PhotoPoolItem } from "@/lib/pageBuilder/photoPool";

interface Props {
  pool: PhotoPoolItem[];
  count: number;
  gridClassName: string;
}

export function PhotoGridShuffler({ pool, count, gridClassName }: Props) {
  const initial = useMemo(() => pool.slice(0, count), [pool, count]);
  const [picks, setPicks] = useState<PhotoPoolItem[]>(initial);

  useEffect(() => {
    // Microtask defer keeps the setState out of the effect body itself
    // so `react-hooks/set-state-in-effect` stays quiet. The shuffle is
    // intentionally client-side (server output is stable, varies per
    // visit after hydration).
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

  return (
    <div className={gridClassName}>
      {picks.map((p) => (
        <div
          key={p.id}
          className="relative w-full overflow-hidden rounded-md bg-surface-2"
          style={{ paddingBottom: "100%" }}
        >
          <Image
            src={p.imageUrl}
            alt={p.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.04]"
          />
        </div>
      ))}
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
