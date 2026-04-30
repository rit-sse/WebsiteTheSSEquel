import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { BlockRenderProps } from "../types";

export async function SponsorWallBlock({
  props,
}: BlockRenderProps<"sponsorWall">) {
  const sponsors = await prisma.sponsor.findMany({
    where: props.onlyActive ? { isActive: true } : {},
    orderBy: { name: "asc" },
  });

  if (sponsors.length === 0) {
    return (
      <div className="my-8 rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
        No sponsors to show.
      </div>
    );
  }

  const isInline = props.layout === "inline";

  return (
    <section className="my-10">
      {props.heading && (
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-5">
          {props.heading}
        </h2>
      )}
      <ul
        className={
          isInline
            ? "flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
            : "grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 items-center"
        }
      >
        {sponsors.map((s) => (
          <li key={s.id} className={isInline ? "" : "flex items-center justify-center"}>
            <Link
              href={s.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className="group inline-flex h-12 w-32 items-center justify-center md:h-14 md:w-40"
            >
              <Image
                src={s.logoUrl}
                alt={s.name}
                width={160}
                height={56}
                className="h-full w-auto object-contain grayscale opacity-70 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
