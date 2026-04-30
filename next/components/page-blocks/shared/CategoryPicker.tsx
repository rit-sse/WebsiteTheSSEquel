"use client";

/**
 * CategoryPicker — a select that lists photo categories live-fetched
 * from `/api/photo-categories`. Used by carousel + grid block editors
 * and anywhere else an officer needs to pick a category.
 *
 * Caches in module scope so multiple pickers on the same editor don't
 * re-hit the API.
 */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PhotoCategory {
  id: number;
  slug: string;
  label: string;
  photoCount: number;
}

let cachedCategories: PhotoCategory[] | null = null;
let inflight: Promise<PhotoCategory[]> | null = null;

async function fetchCategories(): Promise<PhotoCategory[]> {
  if (cachedCategories) return cachedCategories;
  if (inflight) return inflight;
  inflight = fetch("/api/photo-categories")
    .then((r) => r.json())
    .then((j: { categories: PhotoCategory[] }) => {
      cachedCategories = j.categories;
      inflight = null;
      return cachedCategories;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

interface Props {
  value: string;
  onChange: (slug: string) => void;
  id?: string;
}

export function CategoryPicker({ value, onChange, id }: Props) {
  const [categories, setCategories] = useState<PhotoCategory[] | null>(cachedCategories);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    if (cachedCategories) return;
    let cancelled = false;
    fetchCategories()
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !categories) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading categories…
      </div>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {categories.length === 0 && <option value="">(no categories)</option>}
      {categories.map((c) => (
        <option key={c.id} value={c.slug}>
          {c.label} ({c.photoCount})
        </option>
      ))}
    </select>
  );
}
