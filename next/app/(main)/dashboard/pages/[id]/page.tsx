import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getPageById } from "@/lib/services/pageService";
import { PageEditorClient } from "./PageEditorClient";
import {
  PageContentSchema,
  EMPTY_PAGE_CONTENT,
  type BlockNode,
} from "@/lib/pageBuilder/blocks";
import { CANVAS_RENDERABLE_BLOCKS } from "./_editor/blockClassification";
import { ZCardRowBlock } from "@/components/page-blocks/blocks/ZCardRowBlock";
import { PhotoCarouselBlock } from "@/components/page-blocks/blocks/PhotoCarouselBlock";
import { PhotoGridBlock } from "@/components/page-blocks/blocks/PhotoGridBlock";
import { AppWidgetBlock } from "@/components/page-blocks/blocks/AppWidgetBlock";
import { EventFeedBlock } from "@/components/page-blocks/blocks/EventFeedBlock";
import { TestimonialRotatorBlock } from "@/components/page-blocks/blocks/TestimonialRotatorBlock";
import { ProjectListBlock } from "@/components/page-blocks/blocks/ProjectListBlock";
import { OfficerListingBlock } from "@/components/page-blocks/blocks/OfficerListingBlock";
import { SponsorWallBlock } from "@/components/page-blocks/blocks/SponsorWallBlock";
import { HeroSectionBlock } from "@/components/page-blocks/blocks/HeroSectionBlock";
import { RawHtmlBlock } from "@/components/page-blocks/blocks/RawHtmlBlock";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * Server-render each "dynamic" (non-canvas-renderable) block so the
 * client editor can mount the real markup as a child of EditableBlock,
 * not a placeholder. Errors per-block are isolated so a single bad
 * block never breaks the whole editor.
 */
async function renderDynamicSlot(block: BlockNode): Promise<ReactNode> {
  try {
    const props = block.props as never;
    switch (block.type) {
      case "zCardRow":
        return <ZCardRowBlock props={props} />;
      case "photoCarousel":
        return <PhotoCarouselBlock props={props} />;
      case "photoGrid":
        return <PhotoGridBlock props={props} />;
      case "appWidget":
        return <AppWidgetBlock props={props} />;
      case "eventFeed":
        return <EventFeedBlock props={props} />;
      case "testimonialRotator":
        return <TestimonialRotatorBlock props={props} />;
      case "projectList":
        return <ProjectListBlock props={props} />;
      case "officerListing":
        return <OfficerListingBlock props={props} />;
      case "sponsorWall":
        return <SponsorWallBlock props={props} />;
      case "heroSection":
        return <HeroSectionBlock props={props} />;
      case "rawHtml":
        return <RawHtmlBlock props={props} />;
      default:
        return null;
    }
  } catch (err) {
    console.error("[page-editor] Failed to pre-render block", block.type, err);
    return null;
  }
}

export default async function PageEditorRoute({ params }: RouteProps) {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) redirect("/");
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const page = await getPageById(id);
  if (!page) notFound();

  const parsed = PageContentSchema.safeParse(page.draftContent);
  const draftContent = parsed.success ? parsed.data : EMPTY_PAGE_CONTENT;

  // Pre-render every block the client can't render itself. Resolved
  // sequentially so we don't hammer the DB with parallel widget fetches
  // for a typical 6–18 block page; serialised is cheap enough.
  const dynamicSlots: Record<string, ReactNode> = {};
  for (const block of draftContent.blocks) {
    if (block.type === "section") continue;
    if (CANVAS_RENDERABLE_BLOCKS.has(block.type)) continue;
    dynamicSlots[block.id] = await renderDynamicSlot(block);
  }

  return (
    <PageEditorClient
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        systemLocked: page.systemLocked,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        showInNav: page.showInNav,
        navSection: page.navSection,
        navLabel: page.navLabel,
        navOrder: page.navOrder,
        updatedAt: page.updatedAt.toISOString(),
        publishedAt: page.publishedAt?.toISOString() ?? null,
      }}
      initialContent={draftContent}
      isPrimary={auth.isPrimary || auth.isSeAdmin}
      dynamicSlots={dynamicSlots}
    />
  );
}
