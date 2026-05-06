/**
 * Block schema for the page builder.
 *
 * Page content is stored as JSON in `Page.draftContent` / `Page.publishedContent`
 * with the shape `{ version: 1, blocks: BlockNode[] }`. Each block has a
 * `type` (the registry key) and a `props` object whose shape depends on the
 * type. Types are validated via Zod discriminated unions on the server before
 * persisting.
 *
 * Adding a new block: add a Zod schema + default props here, register the
 * render component in `components/page-blocks/registry.ts`, and the editor
 * picks it up automatically.
 */
import { z } from "zod";

// ────────────────────────────────────────────────────────────────────
// Per-block prop schemas
// ────────────────────────────────────────────────────────────────────

/** A heading. Levels map to <h1>..<h4>. */
export const HeadingPropsSchema = z.object({
  text: z.string().min(1).max(200),
  level: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .default(2),
  align: z.enum(["left", "center", "right"]).default("left"),
  /** Optional accent color. `primary` matches the original public-page
   *  pattern of `<h1 className="text-primary">`. */
  accent: z.enum(["none", "primary"]).default("none"),
});
export type HeadingProps = z.infer<typeof HeadingPropsSchema>;

/** Markdown body, sanitized via rehype-sanitize at render time. */
export const MarkdownPropsSchema = z.object({
  body: z.string().max(20000).default(""),
  /** Center-aligning constrains to max-w-3xl mx-auto + text-center, matching
   *  the original About/Get-Involved/Committees hero copy. */
  align: z.enum(["left", "center"]).default("left"),
});
export type MarkdownProps = z.infer<typeof MarkdownPropsSchema>;

/** Single image. `src` may be an /images path, /api/aws/image proxy URL, or remote https URL. */
export const ImagePropsSchema = z.object({
  src: z.string().min(1).max(1000),
  alt: z.string().max(500).default(""),
  caption: z.string().max(500).default(""),
  // Width as a fraction of the content column. Common values: 1, 0.66, 0.5, 0.33.
  widthFraction: z.number().min(0.25).max(1).default(1),
  rounded: z.boolean().default(true),
});
export type ImageProps = z.infer<typeof ImagePropsSchema>;

/** Simple cards for quick link lists, feature grids, and page sections. */
export const CardGridItemSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().max(1200).default(""),
  href: z.string().max(500).optional(),
  ctaText: z.string().max(80).optional(),
  accent: z
    .enum(["orange", "blue", "pink", "green", "neutral"])
    .default("neutral"),
});
export type CardGridItem = z.infer<typeof CardGridItemSchema>;

export const CardGridPropsSchema = z.object({
  heading: z.string().max(120).optional(),
  columns: z.number().int().min(1).max(4).default(3),
  items: z.array(CardGridItemSchema).min(1).max(24),
});
export type CardGridProps = z.infer<typeof CardGridPropsSchema>;

/**
 * Photo carousel — the headline feature.
 *
 * Renders a slow crossfade through a random window of photos pulled from
 * `categorySlug`. Re-shuffles per page mount so different visitors see
 * different orders. Respects `prefers-reduced-motion`.
 */
export const PhotoCarouselPropsSchema = z.object({
  categorySlug: z.string().min(1).max(80),
  count: z.number().int().min(1).max(30).default(10),
  intervalMs: z.number().int().min(2000).max(20000).default(6000),
  // 16:9 default; portrait carousels for hero pages can use 4:5.
  aspectRatio: z
    .enum(["16:9", "4:3", "3:2", "1:1", "4:5", "21:9"])
    .default("16:9"),
  // Show the photo's caption beneath each frame.
  showCaptions: z.boolean().default(false),
  // Newest first (no shuffle) is occasionally the right call (e.g. "latest events").
  order: z.enum(["random", "newest"]).default("random"),
});
export type PhotoCarouselProps = z.infer<typeof PhotoCarouselPropsSchema>;

/** Photo grid — N most recent (or random) photos from a category, like a mini /photos. */
export const PhotoGridPropsSchema = z.object({
  categorySlug: z.string().min(1).max(80),
  count: z.number().int().min(1).max(60).default(12),
  columns: z.number().int().min(2).max(6).default(4),
  order: z.enum(["random", "newest"]).default("newest"),
});
export type PhotoGridProps = z.infer<typeof PhotoGridPropsSchema>;

/** Latest events feed — pulls from the Event table. */
export const EventFeedPropsSchema = z.object({
  mode: z.enum(["upcoming", "past"]).default("upcoming"),
  limit: z.number().int().min(1).max(20).default(6),
  showImages: z.boolean().default(true),
  heading: z.string().max(120).optional(),
});
export type EventFeedProps = z.infer<typeof EventFeedPropsSchema>;

/** Testimonial rotator — pulls Quote rows + Alumni.quote, rotates through them. */
export const TestimonialRotatorPropsSchema = z.object({
  sources: z
    .array(z.enum(["quotes", "alumni"]))
    .min(1)
    .default(["quotes", "alumni"]),
  count: z.number().int().min(1).max(20).default(5),
  intervalMs: z.number().int().min(3000).max(20000).default(8000),
});
export type TestimonialRotatorProps = z.infer<
  typeof TestimonialRotatorPropsSchema
>;

/** Latest projects feed. */
export const ProjectListPropsSchema = z.object({
  mode: z.enum(["active", "completed", "all"]).default("active"),
  limit: z.number().int().min(1).max(20).default(6),
  heading: z.string().max(120).optional(),
});
export type ProjectListProps = z.infer<typeof ProjectListPropsSchema>;

/** Officer listing scoped by position category (e.g. PRIMARY_OFFICER, SE_OFFICE, or all). */
export const OfficerListingPropsSchema = z.object({
  positionCategory: z
    .enum(["PRIMARY_OFFICER", "SE_OFFICE", "ALL"])
    .default("PRIMARY_OFFICER"),
  showInactive: z.boolean().default(false),
});
export type OfficerListingProps = z.infer<typeof OfficerListingPropsSchema>;

/** Sponsor logo wall. */
export const SponsorWallPropsSchema = z.object({
  layout: z.enum(["grid", "inline"]).default("grid"),
  onlyActive: z.boolean().default(true),
  heading: z.string().max(120).optional(),
});
export type SponsorWallProps = z.infer<typeof SponsorWallPropsSchema>;

/**
 * App widget — mounts one of the existing interactive SSE page modules inside
 * a CMS page. This keeps live systems like the photo gallery, event calendar,
 * alumni directory, and mentoring schedule route-owned by the CMS while their
 * records remain managed by their existing dashboards.
 */
export const AppWidgetPropsSchema = z.object({
  widget: z
    .enum([
      "photosGallery",
      "eventsArchive",
      "eventsCalendar",
      "projectsDirectory",
      "membershipLeaderboard",
      "mentorSchedule",
      "alumniDirectory",
      "leadershipDirectory",
      "githubCredits",
      "constitution",
      "primaryOfficersPolicy",
      "sponsorshipTiers",
      "sponsorForms",
    ])
    .default("eventsCalendar"),
  heading: z.string().max(160).optional(),
  body: z.string().max(1000).optional(),
  frame: z.boolean().default(false),
});
export type AppWidgetProps = z.infer<typeof AppWidgetPropsSchema>;

/** ZCardRow — alternating left/right image+text cards (the AboutUsSlot/Committee/Involvement pattern). */
export const ZCardRowItemSchema = z.object({
  imageSrc: z.string().max(1000).default(""),
  imageAlt: z.string().max(500).default(""),
  photoCategorySlug: z.string().max(80).optional(),
  photoCount: z.number().int().min(1).max(12).default(6),
  photoIntervalMs: z.number().int().min(2000).max(20000).default(6000),
  title: z.string().min(1).max(200),
  body: z.string().max(2000),
  // Optional CTA below the body.
  ctaText: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
});
export type ZCardRowItem = z.infer<typeof ZCardRowItemSchema>;

export const ZCardRowPropsSchema = z.object({
  items: z.array(ZCardRowItemSchema).min(1).max(20),
  revealOnScroll: z.boolean().default(false),
});
export type ZCardRowProps = z.infer<typeof ZCardRowPropsSchema>;

/** Divider — horizontal rule with optional label. */
export const DividerPropsSchema = z.object({
  label: z.string().max(80).optional(),
});
export type DividerProps = z.infer<typeof DividerPropsSchema>;

/** Call-to-action button block. */
export const CtaPropsSchema = z.object({
  text: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  variant: z
    .enum(["orange", "blue", "pink", "green", "neutral"])
    .default("orange"),
  align: z.enum(["left", "center", "right"]).default("left"),
});
export type CtaProps = z.infer<typeof CtaPropsSchema>;

/** Hero section — homepage-style title + dancing word + description + CTAs. */
export const HeroSectionCtaSchema = z.object({
  text: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  variant: z
    .enum(["orange", "blue", "pink", "green", "neutral"])
    .default("orange"),
});

export const HeroSectionPropsSchema = z.object({
  title: z.string().min(1).max(200),
  // The word that animates with the dancing-letters effect.
  dancingWord: z.string().max(40).optional(),
  description: z.string().max(1000).default(""),
  calloutLeft: z.string().max(200).optional(),
  calloutRight: z.string().max(200).optional(),
  ctas: z.array(HeroSectionCtaSchema).max(3).default([]),
  // Optional category to pull a hero photo carousel from.
  photoCategorySlug: z.string().max(80).optional(),
});
export type HeroSectionProps = z.infer<typeof HeroSectionPropsSchema>;

/**
 * Raw HTML — escape hatch, sanitized via rehype-sanitize.
 * Officer-only (enforced at the registry/editor level), and even then
 * the renderer never trusts the input.
 */
export const RawHtmlPropsSchema = z.object({
  html: z.string().max(20000).default(""),
});
export type RawHtmlProps = z.infer<typeof RawHtmlPropsSchema>;

/**
 * Section — layout shell for all following blocks until the next section.
 * This intentionally stays flat in the stored block array so drag/reorder
 * remains simple while still giving editors page-depth and layout control.
 */
export const SectionPropsSchema = z.object({
  label: z.string().max(120).default("Section"),
  /** `screenXl` = max-w-screen-xl, the original About/Get-Involved/Committees envelope. */
  width: z
    .enum(["narrow", "content", "screenXl", "wide", "full"])
    .default("wide"),
  depth: z.enum(["none", "1", "2", "3"]).default("none"),
  padding: z.enum(["none", "compact", "normal", "spacious"]).default("normal"),
  background: z
    .enum([
      "transparent",
      "surface",
      "muted",
      "orange",
      "blue",
      "pink",
      "green",
    ])
    .default("transparent"),
  layout: z
    .enum(["stack", "twoColumn", "threeColumn", "grid"])
    .default("stack"),
  gap: z.enum(["compact", "normal", "spacious"]).default("normal"),
  revealOnScroll: z.boolean().default(false),
  /** `neoCard` swaps the depth-2 Card for a NeoCard (sharp neo-brutalist
   *  border). Only meaningful when depth ≠ "none". */
  frame: z.enum(["card", "neoCard"]).default("card"),
});
export type SectionProps = z.infer<typeof SectionPropsSchema>;

/**
 * Bullet list — primary-colored "•" markers, matching the original
 * Sponsors page pattern (`<li className="flex items-start gap-2"><span
 * className="text-primary mt-1">•</span><span>{text}</span></li>`).
 */
export const BulletListPropsSchema = z.object({
  heading: z.string().max(160).optional(),
  items: z.array(z.string().min(1).max(500)).min(1).max(20),
});
export type BulletListProps = z.infer<typeof BulletListPropsSchema>;

/**
 * BulletListPair — composite block that mirrors the original Sponsors
 * "Recruiting Talks" / "ViSE" pattern: `<h2>` heading + optional
 * description paragraph + a 2-column `grid md:grid-cols-2` of
 * (h3 + bullet list) cells. Lives as a single block so the seed maps
 * one-to-one to the original Card structure.
 */
export const BulletListPairColumnSchema = z.object({
  heading: z.string().min(1).max(160),
  items: z.array(z.string().min(1).max(500)).min(1).max(20),
});
export type BulletListPairColumn = z.infer<typeof BulletListPairColumnSchema>;

export const BulletListPairPropsSchema = z.object({
  heading: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  columns: z.tuple([BulletListPairColumnSchema, BulletListPairColumnSchema]),
});
export type BulletListPairProps = z.infer<typeof BulletListPairPropsSchema>;

// ────────────────────────────────────────────────────────────────────
// BlockNode discriminated union
// ────────────────────────────────────────────────────────────────────

/**
 * Every block carries a stable client-generated UUID `id`. The editor
 * uses this for drag-reorder keying and selection state.
 */
export const BlockNodeSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("heading"),
    props: HeadingPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("markdown"),
    props: MarkdownPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("image"),
    props: ImagePropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("cardGrid"),
    props: CardGridPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("photoCarousel"),
    props: PhotoCarouselPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("photoGrid"),
    props: PhotoGridPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("eventFeed"),
    props: EventFeedPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("testimonialRotator"),
    props: TestimonialRotatorPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("projectList"),
    props: ProjectListPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("officerListing"),
    props: OfficerListingPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("sponsorWall"),
    props: SponsorWallPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("appWidget"),
    props: AppWidgetPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("zCardRow"),
    props: ZCardRowPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("divider"),
    props: DividerPropsSchema,
  }),
  z.object({ id: z.string(), type: z.literal("cta"), props: CtaPropsSchema }),
  z.object({
    id: z.string(),
    type: z.literal("heroSection"),
    props: HeroSectionPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("rawHtml"),
    props: RawHtmlPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("section"),
    props: SectionPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("bulletList"),
    props: BulletListPropsSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("bulletListPair"),
    props: BulletListPairPropsSchema,
  }),
]);
export type BlockNode = z.infer<typeof BlockNodeSchema>;
export type BlockType = BlockNode["type"];

/**
 * Versioned envelope so we can evolve the block schema without writing
 * a one-off migration over every Page row. Bumping `version` is a deliberate
 * operation that comes with a content walker that re-shapes old blocks.
 */
export const PageContentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(BlockNodeSchema).max(200),
});
export type PageContent = z.infer<typeof PageContentSchema>;

/** Empty content for newly created pages. */
export const EMPTY_PAGE_CONTENT: PageContent = { version: 1, blocks: [] };

// ────────────────────────────────────────────────────────────────────
// Block metadata (label, default props, category, primary-only flag)
//
// Used by the editor's "Add block" menu and registry. Render components
// live alongside this in the registry so the data layer (this file)
// stays free of React.
// ────────────────────────────────────────────────────────────────────

/** Logical grouping in the "Add block" menu. */
export type BlockCategory =
  | "layout"
  | "primitive"
  | "media"
  | "dynamic"
  | "officer-only";

export interface BlockMeta<T extends BlockType> {
  type: T;
  label: string;
  description: string;
  category: BlockCategory;
  primaryOnly?: boolean;
  defaultProps: Extract<BlockNode, { type: T }>["props"];
}

export const BLOCK_META: { [K in BlockType]: BlockMeta<K> } = {
  section: {
    type: "section",
    label: "Section",
    description: "Controls width, depth, spacing, background, and layout.",
    category: "layout",
    defaultProps: {
      label: "Section",
      width: "wide",
      depth: "none",
      padding: "normal",
      background: "transparent",
      layout: "stack",
      gap: "normal",
      revealOnScroll: false,
      frame: "card",
    },
  },
  heading: {
    type: "heading",
    label: "Heading",
    description: "A section title (h1–h4).",
    category: "primitive",
    defaultProps: {
      text: "Section title",
      level: 2,
      align: "left",
      accent: "none",
    },
  },
  markdown: {
    type: "markdown",
    label: "Text",
    description: "Markdown body — paragraphs, lists, links.",
    category: "primitive",
    defaultProps: { body: "", align: "left" },
  },
  bulletList: {
    type: "bulletList",
    label: "Bullet list",
    description:
      "Vertical list with primary-colored • markers — the classic SSE bullet style.",
    category: "primitive",
    defaultProps: {
      heading: "List heading",
      items: ["First point", "Second point", "Third point"],
    },
  },
  bulletListPair: {
    type: "bulletListPair",
    label: "Two bullet lists",
    description:
      "Heading + optional description + two side-by-side primary-bullet columns.",
    category: "layout",
    defaultProps: {
      heading: "Section heading",
      columns: [
        {
          heading: "Left column",
          items: ["Point one", "Point two", "Point three"],
        },
        {
          heading: "Right column",
          items: ["Point one", "Point two", "Point three"],
        },
      ],
    },
  },
  image: {
    type: "image",
    label: "Image",
    description: "A single image with optional caption.",
    category: "primitive",
    defaultProps: {
      src: "",
      alt: "",
      caption: "",
      widthFraction: 1,
      rounded: true,
    },
  },
  cardGrid: {
    type: "cardGrid",
    label: "Card grid",
    description: "Responsive cards with optional links.",
    category: "primitive",
    defaultProps: {
      heading: "Cards",
      columns: 3,
      items: [
        {
          title: "Card title",
          body: "Use cards for short summaries, links, or calls to action.",
          href: "",
          ctaText: "Learn more",
          accent: "neutral",
        },
      ],
    },
  },
  divider: {
    type: "divider",
    label: "Divider",
    description: "A horizontal rule.",
    category: "primitive",
    defaultProps: {},
  },
  cta: {
    type: "cta",
    label: "Call-to-action",
    description: "A prominent button linking somewhere.",
    category: "primitive",
    defaultProps: {
      text: "Learn more",
      href: "/",
      variant: "orange",
      align: "left",
    },
  },
  photoCarousel: {
    type: "photoCarousel",
    label: "Photo carousel",
    description: "Auto-cycling slideshow from a photo category.",
    category: "media",
    defaultProps: {
      categorySlug: "general",
      count: 10,
      intervalMs: 6000,
      aspectRatio: "16:9",
      showCaptions: false,
      order: "random",
    },
  },
  photoGrid: {
    type: "photoGrid",
    label: "Photo grid",
    description: "A grid of photos pulled from a category.",
    category: "media",
    defaultProps: {
      categorySlug: "general",
      count: 12,
      columns: 4,
      order: "newest",
    },
  },
  zCardRow: {
    type: "zCardRow",
    label: "Image + text cards",
    description: "Alternating left/right cards with image and body.",
    category: "media",
    defaultProps: {
      items: [
        {
          imageSrc: "",
          imageAlt: "",
          photoCategorySlug: "",
          photoCount: 6,
          photoIntervalMs: 6000,
          title: "Card title",
          body: "",
        },
      ],
      revealOnScroll: false,
    },
  },
  heroSection: {
    type: "heroSection",
    label: "Hero section",
    description: "Page hero with title, description, CTAs, and optional photo.",
    category: "media",
    defaultProps: HeroSectionPropsSchema.parse({
      title: "Welcome",
      description: "",
    }),
  },
  eventFeed: {
    type: "eventFeed",
    label: "Events feed",
    description: "Latest upcoming or past events from the Event table.",
    category: "dynamic",
    defaultProps: { mode: "upcoming", limit: 6, showImages: true },
  },
  testimonialRotator: {
    type: "testimonialRotator",
    label: "Testimonial rotator",
    description: "Rotating alumni quotes and submitted testimonials.",
    category: "dynamic",
    defaultProps: { sources: ["quotes", "alumni"], count: 5, intervalMs: 8000 },
  },
  projectList: {
    type: "projectList",
    label: "Projects feed",
    description: "Latest projects with images and links.",
    category: "dynamic",
    defaultProps: { mode: "active", limit: 6 },
  },
  officerListing: {
    type: "officerListing",
    label: "Officer listing",
    description: "Officers grouped by position category.",
    category: "dynamic",
    defaultProps: { positionCategory: "PRIMARY_OFFICER", showInactive: false },
  },
  sponsorWall: {
    type: "sponsorWall",
    label: "Sponsor wall",
    description: "Sponsor logos in a grid or inline row.",
    category: "dynamic",
    defaultProps: { layout: "grid", onlyActive: true },
  },
  appWidget: {
    type: "appWidget",
    label: "SSE app widget",
    description:
      "Existing interactive SSE modules inside an editable CMS page.",
    category: "dynamic",
    defaultProps: {
      widget: "eventsCalendar",
      heading: "",
      body: "",
      frame: false,
    },
  },
  rawHtml: {
    type: "rawHtml",
    label: "Raw HTML",
    description: "Sanitized custom HTML — use sparingly.",
    category: "officer-only",
    primaryOnly: true,
    defaultProps: { html: "" },
  },
};

export const BLOCK_TYPES: BlockType[] = Object.keys(BLOCK_META) as BlockType[];

// ────────────────────────────────────────────────────────────────────
// Slug validation
//
// Slugs allow nested paths via `/` (e.g. "about/get-involved") so the
// page builder can mirror the existing folder-based URL structure.
// Reserved prefixes prevent shadowing or impersonating existing
// interactive routes (api, dashboard, etc.) — the [...slug] catch-all
// only catches what isn't already an explicit segment, but a Page
// record at a reserved slug is still a UX footgun (e.g. dashboard
// preview link works but public route doesn't).
// ────────────────────────────────────────────────────────────────────

export const RESERVED_SLUG_PREFIXES = [
  "api",
  "dashboard",
  "_next",
  "__cms",
  "cms-render",
  "auth",
  "print",
  "profile",
  "settings",
  "go",
  "library",
  "home-",
] as const;

const SLUG_REGEX = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

export function validateSlug(
  input: string,
): { ok: true; slug: string } | { ok: false; error: string } {
  const slug = input.trim().toLowerCase();
  if (!slug) return { ok: false, error: "Slug is required." };
  if (slug.length > 200)
    return { ok: false, error: "Slug must be 200 characters or fewer." };
  if (!SLUG_REGEX.test(slug)) {
    return {
      ok: false,
      error:
        "Slug must be lowercase letters, digits, hyphens, and slashes only (e.g. about/get-involved).",
    };
  }
  const firstSegment = slug.split("/")[0]!;
  for (const prefix of RESERVED_SLUG_PREFIXES) {
    if (firstSegment === prefix || firstSegment.startsWith(prefix)) {
      return {
        ok: false,
        error: `"${firstSegment}" is reserved for an existing route.`,
      };
    }
  }
  return { ok: true, slug };
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Auto-generate a SEO description from page content. Walks the block
 * list and picks the first markdown body or hero description, trimmed
 * to ~160 chars. Falls back to the page title.
 */
export function autoDescribe(
  content: PageContent | null | undefined,
  fallback: string,
): string {
  if (!content) return fallback;
  for (const block of content.blocks) {
    if (block.type === "markdown" && block.props.body.trim()) {
      return truncateForSeo(stripMarkdown(block.props.body));
    }
    if (block.type === "heroSection" && block.props.description.trim()) {
      return truncateForSeo(block.props.description);
    }
    if (block.type === "cardGrid") {
      const body = block.props.items.find((item) => item.body.trim())?.body;
      if (body) return truncateForSeo(body);
    }
    if (block.type === "appWidget" && block.props.body?.trim()) {
      return truncateForSeo(block.props.body);
    }
    if (block.type === "heading") {
      // headings are too short to be a useful meta description
      continue;
    }
  }
  return fallback;
}

function stripMarkdown(s: string): string {
  return s
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[*_`#>~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateForSeo(s: string): string {
  if (s.length <= 160) return s;
  return s.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}
