import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import prisma from "@/lib/prisma";
import type { BlockRenderProps } from "../types";

export async function ProjectListBlock({
  props,
}: BlockRenderProps<"projectList">) {
  const projects = await prisma.project.findMany({
    where:
      props.mode === "active"
        ? { completed: false }
        : props.mode === "completed"
          ? { completed: true }
          : {},
    orderBy: { id: "desc" },
    take: props.limit,
    include: { lead: { select: { id: true, name: true } } },
  });

  if (projects.length === 0) {
    return (
      <div className="my-8 rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
        No projects to show right now.
      </div>
    );
  }

  return (
    <section className="my-10">
      {props.heading && (
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-5">
          {props.heading}
        </h2>
      )}
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li
            key={p.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-card neo:shadow-neo transition-transform"
          >
            {p.projectImage && (
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                <Image
                  src={p.projectImage}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-display text-lg font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Lead: {p.lead.name}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-foreground/85">{p.description}</p>
              <div className="mt-4 flex items-center gap-3 text-xs">
                {p.repoLink && (
                  <Link
                    href={p.repoLink}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Github className="h-3.5 w-3.5" />
                    Repo
                  </Link>
                )}
                {p.completed ? (
                  <span className="rounded bg-categorical-green/20 px-2 py-0.5 font-semibold uppercase tracking-wider text-foreground">
                    Shipped
                  </span>
                ) : (
                  <span className="rounded bg-categorical-orange/20 px-2 py-0.5 font-semibold uppercase tracking-wider text-foreground">
                    Active
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
