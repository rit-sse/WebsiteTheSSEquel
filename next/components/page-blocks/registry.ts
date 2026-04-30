/**
 * Block render registry.
 *
 * Maps each `BlockNode.type` to its render component. Server / client
 * boundaries are handled by the components themselves — the renderer
 * just looks up the entry and calls it.
 *
 * Editor components are imported lazily by the dashboard so this file
 * can be used in pure-server contexts without pulling in client-only
 * editor code.
 */
import type { ComponentType } from "react";
import type { BlockNode, BlockType } from "@/lib/pageBuilder/blocks";
import type { BlockRenderProps } from "./types";

import { HeadingBlock } from "./blocks/HeadingBlock";
import { MarkdownBlock } from "./blocks/MarkdownBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { CtaBlock } from "./blocks/CtaBlock";
import { PhotoCarouselBlock } from "./blocks/PhotoCarouselBlock";
import { PhotoGridBlock } from "./blocks/PhotoGridBlock";
import { ZCardRowBlock } from "./blocks/ZCardRowBlock";
import { HeroSectionBlock } from "./blocks/HeroSectionBlock";
import { EventFeedBlock } from "./blocks/EventFeedBlock";
import { TestimonialRotatorBlock } from "./blocks/TestimonialRotatorBlock";
import { ProjectListBlock } from "./blocks/ProjectListBlock";
import { OfficerListingBlock } from "./blocks/OfficerListingBlock";
import { SponsorWallBlock } from "./blocks/SponsorWallBlock";
import { RawHtmlBlock } from "./blocks/RawHtmlBlock";

// Type-erased registry entries. The PageRenderer hands a block's
// runtime props back in via React.createElement; the cast to `AnyRender`
// is the seam where compile-time type safety per block-type narrows
// to "any object with the right shape" at the registry boundary.
type AnyRender = ComponentType<BlockRenderProps<any>>;

export const RENDER_REGISTRY: Record<BlockType, AnyRender> = {
  heading: HeadingBlock as AnyRender,
  markdown: MarkdownBlock as AnyRender,
  image: ImageBlock as AnyRender,
  divider: DividerBlock as AnyRender,
  cta: CtaBlock as AnyRender,
  photoCarousel: PhotoCarouselBlock as AnyRender,
  photoGrid: PhotoGridBlock as AnyRender,
  zCardRow: ZCardRowBlock as AnyRender,
  heroSection: HeroSectionBlock as AnyRender,
  eventFeed: EventFeedBlock as AnyRender,
  testimonialRotator: TestimonialRotatorBlock as AnyRender,
  projectList: ProjectListBlock as AnyRender,
  officerListing: OfficerListingBlock as AnyRender,
  sponsorWall: SponsorWallBlock as AnyRender,
  rawHtml: RawHtmlBlock as AnyRender,
};

export function getRender(type: BlockNode["type"]): AnyRender | null {
  return RENDER_REGISTRY[type] ?? null;
}
