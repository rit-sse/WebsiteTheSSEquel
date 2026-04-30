import prisma from "@/lib/prisma";
import type { BlockRenderProps } from "../types";

/**
 * OfficerListingBlock — current officers grouped by position category.
 * Lightweight: just names + position titles for now (avatar requires
 * S3 image proxy logic that isn't worth duplicating in a generic block).
 */
export async function OfficerListingBlock({
  props,
}: BlockRenderProps<"officerListing">) {
  const where = {
    is_active: props.showInactive ? undefined : true,
    position:
      props.positionCategory === "ALL"
        ? undefined
        : { category: props.positionCategory },
  } as const;

  const officers = await prisma.officer.findMany({
    where,
    orderBy: [
      { position: { is_primary: "desc" } },
      { position: { title: "asc" } },
    ],
    include: {
      user: { select: { id: true, name: true } },
      position: { select: { title: true, is_primary: true, category: true } },
    },
  });

  if (officers.length === 0) {
    return (
      <div className="my-8 rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
        No officers to show.
      </div>
    );
  }

  return (
    <section className="my-10">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {officers.map((o) => (
          <li
            key={o.id}
            className="rounded-lg border border-border bg-card p-4 neo:shadow-neo"
          >
            <p className="font-display text-base font-semibold tracking-tight">
              {o.user.name}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {o.position.title}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
