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
import { GoneNotice } from "@/app/(main)/[...slug]/GoneNotice";

type Search = { [k: string]: string | string[] | undefined };

function joinSlug(parts: string[] | undefined): string {
  return (parts ?? []).map((p) => decodeURIComponent(p)).join("/");
}

function safeParseContent(value: unknown): PageContent | null {
  const parsed = PageContentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function generateCmsPageMetadata(slugParts: string[] | undefined): Promise<Metadata> {
  const slug = joinSlug(slugParts);
  if (!slug) return { title: "Not Found" };
  const page = await getPagePublic(slug);
  if (!page) return { title: "Not Found" };
  if (page.status !== "PUBLISHED") return { title: page.title };
  const content = safeParseContent(page.publishedContent);
  return {
    title: page.seoTitle ?? page.title,
    description:
      page.seoDescription ?? autoDescribe(content, page.title).slice(0, 200),
  };
}

export async function renderCmsPage({
  slugParts,
  searchParams,
}: {
  slugParts: string[] | undefined;
  searchParams: Search;
}) {
  const slug = joinSlug(slugParts);
  if (!slug) notFound();

  const isPreview = searchParams.preview === "1" || searchParams.preview === "true";

  if (isPreview) {
    const auth = await getAuthLevel();
    if (!auth.isOfficer && !auth.isSeAdmin) {
      notFound();
    }
    const page = await getPageDraftBySlug(slug);
    if (!page || page.status === "ARCHIVED") notFound();
    const content = safeParseContent(page.draftContent);
    return (
      <div className="w-full">
        <PreviewBanner slug={slug} title={page.title} status={page.status} />
        <PageRenderer content={content} preview />
      </div>
    );
  }

  const page = await getPagePublic(slug);
  if (!page) notFound();

  if (page.status === "ARCHIVED") {
    return <GoneNotice slug={slug} />;
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
          <span className="font-display text-xs font-semibold uppercase tracking-wider">
            Preview
          </span>{" "}
          - {title}{" "}
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
