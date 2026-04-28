"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

interface Announcement {
  id: number;
  message: string;
  category: string | null;
  active: boolean;
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/announcement");
        if (res.ok) {
          const data: Announcement[] = await res.json();
          setAnnouncements(data);
        }
      } catch {
        // Silently ignore – banner is non-critical
      }
    })();
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-0">
      {visible.map((a) => (
        <div
          key={a.id}
          className="relative flex items-center justify-center gap-2 bg-primary/10 border-b border-primary/20 px-4 py-2 text-sm text-foreground"
        >
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-center">
            {a.category && (
              <span className="font-semibold mr-1">[{a.category}]</span>
            )}
            {a.message}
          </span>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary/10 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}
