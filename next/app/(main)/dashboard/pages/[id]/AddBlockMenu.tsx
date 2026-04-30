"use client";

import { Modal } from "@/components/ui/modal";
import { BLOCK_META, BLOCK_TYPES, type BlockType } from "@/lib/pageBuilder/blocks";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (type: BlockType) => void;
  canAddPrimaryOnly: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  primitive: "Primitives",
  media: "Media",
  dynamic: "Dynamic feeds",
  "officer-only": "Advanced",
};

const CATEGORY_ORDER = ["primitive", "media", "dynamic", "officer-only"] as const;

export function AddBlockMenu({ open, onClose, onAdd, canAddPrimaryOnly }: Props) {
  const grouped = new Map<string, BlockType[]>();
  for (const t of BLOCK_TYPES) {
    const meta = BLOCK_META[t];
    const arr = grouped.get(meta.category) ?? [];
    arr.push(t);
    grouped.set(meta.category, arr);
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title="Add a block">
      <div className="flex flex-col gap-5">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat);
          if (!items?.length) return null;
          return (
            <section key={cat}>
              <h3 className="mb-2 text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[cat] ?? cat}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((type) => {
                  const meta = BLOCK_META[type];
                  const blocked = !!meta.primaryOnly && !canAddPrimaryOnly;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onAdd(type)}
                      disabled={blocked}
                      className={[
                        "rounded-md border-2 border-border bg-card px-3 py-2.5 text-left transition-all",
                        blocked
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:border-foreground hover:translate-y-[-1px] hover:shadow-sm",
                      ].join(" ")}
                    >
                      <p className="font-display text-sm font-semibold tracking-tight">
                        {meta.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                        {blocked ? "Primary officers only" : meta.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
