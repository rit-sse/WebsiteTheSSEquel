"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ArchivedPage {
  id: number;
  slug: string;
  title: string;
  archivedAt: string | null;
  updatedAt: string;
}

export function TrashListClient({
  initialPages,
  canRestore,
}: {
  initialPages: ArchivedPage[];
  canRestore: boolean;
}) {
  const router = useRouter();
  const [restoring, setRestoring] = useState<number | null>(null);

  if (initialPages.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No archived pages.
      </p>
    );
  }

  async function restore(id: number) {
    setRestoring(id);
    try {
      const res = await fetch(`/api/pages/${id}/restore`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Restore failed");
        return;
      }
      toast.success("Page restored to draft");
      router.refresh();
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {initialPages.map((p) => (
        <Card key={p.id} depth={2} className="p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-semibold tracking-tight truncate">
              {p.title}
            </p>
            <p className="text-xs text-muted-foreground font-mono">/{p.slug}</p>
            {p.archivedAt && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mt-0.5">
                Archived {new Date(p.archivedAt).toLocaleString()}
              </p>
            )}
          </div>
          {canRestore && (
            <Button
              size="sm"
              variant="neutral"
              onClick={() => restore(p.id)}
              disabled={restoring === p.id}
            >
              {restoring === p.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Restore
                </>
              )}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
