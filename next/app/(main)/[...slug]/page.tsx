/**
 * Dynamic page catch-all.
 *
 * Resolves a `[...slug]` to a `Page` record:
 * - explicitly-routed segments (e.g. `app/(main)/about/page.tsx`)
 *   win first; this file only catches the rest.
 * - PUBLISHED page → render its blocks.
 * - DRAFT page (anonymous) → 404. Officer with `?preview=1` → render draft.
 * - ARCHIVED page → 410 Gone via the GoneNotice component (Next renders
 *   it under a 200 by default, so we set `notFound()` semantics for SEO
 *   while showing a friendlier message; if your hosting layer needs a
 *   real 410, wire it through the route handlers in middleware).
 * - No record at all → 404.
 *
 * ISR'd at 30s; mutations call `revalidatePath` to bust early.
 */
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPageDraftBySlug,
  getPagePublic,
} from "@/lib/services/pageService";
import { PageContentSchema, autoDescribe } from "@/lib/pageBuilder/blocks";
import type { PageContent } from "@/lib/pageBuilder/blocks";
import { PageRenderer } from "@/components/page-blocks/PageRenderer";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { GoneNotice } from "./GoneNotice";

export const revalidate = 30;

type Search = { [k: string]: string | string[] | undefined };

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Search>;
}

function joinSlug(parts: string[]): string {
  return parts.map((p) => decodeURIComponent(p)).join("/");
}

function safeParseContent(value: unknown): PageContent | null {
  const parsed = PageContentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPagePublic(joinSlug(slug));
  if (!page) return { title: "Not Found" };
  if (page.status !== "PUBLISHED") return { title: page.title };
  const content = safeParseContent(page.publishedContent);
  return {
    title: page.seoTitle ?? page.title,
    description:
      page.seoDescription ?? autoDescribe(content, page.title).slice(0, 200),
  };
}

export default async function DynamicPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const slugStr = joinSlug(slug);
  const isPreview = sp.preview === "1" || sp.preview === "true";

  if (isPreview) {
    const auth = await getAuthLevel();
    if (!auth.isOfficer && !auth.isSeAdmin) {
      notFound();
    }
    const page = await getPageDraftBySlug(slugStr);
    if (!page || page.status === "ARCHIVED") notFound();
    const content = safeParseContent(page.draftContent);
    return (
      <div className="w-full">
        <PreviewBanner slug={slugStr} title={page.title} status={page.status} />
        <PageRenderer content={content} preview />
      </div>
    );
  }

  const page = await getPagePublic(slugStr);
  if (!page) notFound();

  if (page.status === "ARCHIVED") {
    // Note: returning a real 410 status code requires a route handler
    // since RSC doesn't expose a direct way to set the response code
    // in the App Router. Render the gone notice and let bots see it.
    return <GoneNotice slug={slugStr} />;
  }

  if (page.status !== "PUBLISHED") {
    notFound();
  }

  const content = safeParseContent(page.publishedContent);
  return <PageRenderer content={content} />;
}

function PreviewBanner({
  slug,
  title,
  status,
}: {
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  return (
    <div className="sticky top-[3.75rem] z-40 mx-auto w-full max-w-4xl px-4">
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border-2 border-categorical-orange bg-categorical-orange/15 px-4 py-2.5 text-sm shadow-sm backdrop-blur">
        <div>
          <span className="font-display font-semibold uppercase tracking-wider text-xs">
            Preview
          </span>{" "}
          — {title}{" "}
          <span className="ml-2 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase">
            {status}
          </span>
        </div>
        <Link
          href={`/dashboard/pages?slug=${encodeURIComponent(slug)}`}
          className="text-xs underline underline-offset-2 hover:no-underline"
        >
          Edit in dashboard
        </Link>
      </div>
    </div>
  );
}
