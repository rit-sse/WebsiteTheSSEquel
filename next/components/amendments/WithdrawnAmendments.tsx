"use client";

import { useState } from "react";
import AmendmentCard from "@/components/amendments/AmendmentCard";
import { ChevronDown } from "lucide-react";
import type { AmendmentStatus } from "@prisma/client";

type AmendmentRow = {
  id: number;
  title: string;
  description: string;
  status: AmendmentStatus;
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  originalContent?: string;
  proposedContent?: string;
  author?: { id: number; name: string | null };
};

type Props = {
  amendments: AmendmentRow[];
  userVotes: Record<number, boolean>;
  userId: number | null;
};

export default function WithdrawnAmendments({ amendments, userVotes, userId }: Props) {
  const [open, setOpen] = useState(false);

  if (amendments.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <span>
          {amendments.length} withdrawn / rejected amendment{amendments.length !== 1 ? "s" : ""}
        </span>
      </button>

      {open && (
        <div className="space-y-2 mt-3">
          {amendments.map((amendment) => (
            <AmendmentCard
              key={amendment.id}
              amendment={amendment}
              userVote={userVotes[amendment.id] ?? null}
              isAuthor={amendment.author?.id === userId}
              muted
            />
          ))}
        </div>
      )}
    </div>
  );
}
