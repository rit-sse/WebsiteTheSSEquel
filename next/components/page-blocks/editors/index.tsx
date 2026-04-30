"use client";

/**
 * Block editors.
 *
 * Each editor is a controlled form: it receives `props` and an
 * `onChange(nextProps)` callback. Editors do NOT call the API — the
 * dashboard's autosave loop persists changes via PUT /api/pages/[id]
 * with the entire updated content array.
 *
 * Bundled into one file so a single import point covers all 15 block
 * types. Adding a new block: write its editor here, register it in
 * EDITOR_REGISTRY, and the editor panel resolves it automatically.
 */

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "../shared/EditorPrimitives";
import { CategoryPicker } from "../shared/CategoryPicker";
import type { BlockEditorProps } from "../types";
import type { BlockType } from "@/lib/pageBuilder/blocks";

// ──────── Primitives ────────

function HeadingEditor({ props, onChange }: BlockEditorProps<"heading">) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Text"
        value={props.text}
        onChange={(v) => onChange({ ...props, text: v })}
        maxLength={200}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Level"
          value={String(props.level) as "1" | "2" | "3" | "4"}
          onChange={(v) => onChange({ ...props, level: Number(v) as 1 | 2 | 3 | 4 })}
          options={[
            { value: "1", label: "H1 — Page title" },
            { value: "2", label: "H2 — Section" },
            { value: "3", label: "H3 — Sub-section" },
            { value: "4", label: "H4 — Detail" },
          ]}
        />
        <SelectField
          label="Align"
          value={props.align}
          onChange={(v) => onChange({ ...props, align: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
      </div>
    </div>
  );
}

function MarkdownEditor({ props, onChange }: BlockEditorProps<"markdown">) {
  return (
    <TextAreaField
      label="Body (markdown supported)"
      hint="GitHub-flavored markdown — bold, lists, links, tables."
      value={props.body}
      onChange={(v) => onChange({ ...props, body: v })}
      rows={8}
      maxLength={20000}
    />
  );
}

function ImageEditor({ props, onChange }: BlockEditorProps<"image">) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Image URL"
        hint="Use /images/foo.jpg for static, or paste a CDN URL."
        value={props.src}
        onChange={(v) => onChange({ ...props, src: v })}
      />
      <TextField
        label="Alt text"
        hint="Describe the image for screen readers."
        value={props.alt}
        onChange={(v) => onChange({ ...props, alt: v })}
        maxLength={500}
      />
      <TextField
        label="Caption (optional)"
        value={props.caption}
        onChange={(v) => onChange({ ...props, caption: v })}
        maxLength={500}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Width"
          value={String(props.widthFraction) as "1" | "0.66" | "0.5" | "0.33"}
          onChange={(v) =>
            onChange({ ...props, widthFraction: Number(v) as 1 | 0.66 | 0.5 | 0.33 })
          }
          options={[
            { value: "1", label: "Full" },
            { value: "0.66", label: "2/3" },
            { value: "0.5", label: "1/2" },
            { value: "0.33", label: "1/3" },
          ]}
        />
        <Field label="Style">
          <ToggleField
            label="Rounded corners"
            value={props.rounded}
            onChange={(v) => onChange({ ...props, rounded: v })}
          />
        </Field>
      </div>
    </div>
  );
}

function DividerEditor({ props, onChange }: BlockEditorProps<"divider">) {
  return (
    <TextField
      label="Label (optional)"
      hint="Leave blank for a plain horizontal rule."
      value={props.label ?? ""}
      onChange={(v) => onChange({ ...props, label: v || undefined })}
      maxLength={80}
    />
  );
}

function CtaEditor({ props, onChange }: BlockEditorProps<"cta">) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Button text"
        value={props.text}
        onChange={(v) => onChange({ ...props, text: v })}
        maxLength={80}
      />
      <TextField
        label="Link"
        hint="Internal: /events or /about. External: https://…"
        value={props.href}
        onChange={(v) => onChange({ ...props, href: v })}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Color"
          value={props.variant}
          onChange={(v) => onChange({ ...props, variant: v })}
          options={[
            { value: "orange", label: "Orange" },
            { value: "blue", label: "Blue" },
            { value: "pink", label: "Pink" },
            { value: "green", label: "Green" },
            { value: "neutral", label: "Neutral" },
          ]}
        />
        <SelectField
          label="Align"
          value={props.align}
          onChange={(v) => onChange({ ...props, align: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
      </div>
    </div>
  );
}

// ──────── Media ────────

function PhotoCarouselEditor({ props, onChange }: BlockEditorProps<"photoCarousel">) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Photo category" hint="Photos slowly cascade through this category.">
        <CategoryPicker
          value={props.categorySlug}
          onChange={(slug) => onChange({ ...props, categorySlug: slug })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Photo count"
          value={props.count}
          onChange={(v) => onChange({ ...props, count: v })}
          min={1}
          max={30}
        />
        <NumberField
          label="Interval (ms)"
          value={props.intervalMs}
          onChange={(v) => onChange({ ...props, intervalMs: v })}
          min={2000}
          max={20000}
          step={500}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Aspect ratio"
          value={props.aspectRatio}
          onChange={(v) => onChange({ ...props, aspectRatio: v })}
          options={[
            { value: "16:9", label: "16:9 — Wide" },
            { value: "21:9", label: "21:9 — Cinematic" },
            { value: "3:2", label: "3:2 — Photo" },
            { value: "4:3", label: "4:3 — Classic" },
            { value: "1:1", label: "1:1 — Square" },
            { value: "4:5", label: "4:5 — Portrait" },
          ]}
        />
        <SelectField
          label="Order"
          value={props.order}
          onChange={(v) => onChange({ ...props, order: v })}
          options={[
            { value: "random", label: "Random per visit" },
            { value: "newest", label: "Newest first" },
          ]}
        />
      </div>
      <ToggleField
        label="Show captions"
        value={props.showCaptions}
        onChange={(v) => onChange({ ...props, showCaptions: v })}
      />
    </div>
  );
}

function PhotoGridEditor({ props, onChange }: BlockEditorProps<"photoGrid">) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Photo category">
        <CategoryPicker
          value={props.categorySlug}
          onChange={(slug) => onChange({ ...props, categorySlug: slug })}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <NumberField
          label="Photo count"
          value={props.count}
          onChange={(v) => onChange({ ...props, count: v })}
          min={1}
          max={60}
        />
        <NumberField
          label="Columns"
          value={props.columns}
          onChange={(v) => onChange({ ...props, columns: v })}
          min={2}
          max={6}
        />
        <SelectField
          label="Order"
          value={props.order}
          onChange={(v) => onChange({ ...props, order: v })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "random", label: "Random" },
          ]}
        />
      </div>
    </div>
  );
}

function ZCardRowEditor({ props, onChange }: BlockEditorProps<"zCardRow">) {
  function update(i: number, patch: Partial<(typeof props.items)[number]>) {
    const items = props.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange({ ...props, items });
  }
  function remove(i: number) {
    onChange({ ...props, items: props.items.filter((_, idx) => idx !== i) });
  }
  function add() {
    onChange({
      ...props,
      items: [
        ...props.items,
        { imageSrc: "", imageAlt: "", title: "Card title", body: "" },
      ],
    });
  }
  return (
    <div className="flex flex-col gap-4">
      {props.items.map((item, i) => (
        <div
          key={i}
          className="rounded-md border border-border bg-card/50 p-3 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
              Card {i + 1}
            </span>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => remove(i)}
              disabled={props.items.length <= 1}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <TextField
            label="Title"
            value={item.title}
            onChange={(v) => update(i, { title: v })}
            maxLength={200}
          />
          <TextField
            label="Image URL"
            value={item.imageSrc}
            onChange={(v) => update(i, { imageSrc: v })}
          />
          <TextField
            label="Image alt"
            value={item.imageAlt}
            onChange={(v) => update(i, { imageAlt: v })}
            maxLength={500}
          />
          <TextAreaField
            label="Body"
            value={item.body}
            onChange={(v) => update(i, { body: v })}
            rows={4}
            maxLength={2000}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="CTA text (optional)"
              value={item.ctaText ?? ""}
              onChange={(v) => update(i, { ctaText: v || undefined })}
              maxLength={80}
            />
            <TextField
              label="CTA link"
              value={item.ctaHref ?? ""}
              onChange={(v) => update(i, { ctaHref: v || undefined })}
            />
          </div>
        </div>
      ))}
      <Button variant="neutral" size="sm" onClick={add} disabled={props.items.length >= 20}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add card
      </Button>
    </div>
  );
}

function HeroSectionEditor({ props, onChange }: BlockEditorProps<"heroSection">) {
  function updateCta(i: number, patch: Partial<(typeof props.ctas)[number]>) {
    const ctas = props.ctas.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange({ ...props, ctas });
  }
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Title"
        value={props.title}
        onChange={(v) => onChange({ ...props, title: v })}
        maxLength={200}
      />
      <TextField
        label="Dancing word (optional)"
        hint="Shown beneath the title with the playful letter animation."
        value={props.dancingWord ?? ""}
        onChange={(v) => onChange({ ...props, dancingWord: v || undefined })}
        maxLength={40}
      />
      <TextAreaField
        label="Description"
        value={props.description}
        onChange={(v) => onChange({ ...props, description: v })}
        rows={3}
        maxLength={1000}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Callout left"
          value={props.calloutLeft ?? ""}
          onChange={(v) => onChange({ ...props, calloutLeft: v || undefined })}
          maxLength={200}
        />
        <TextField
          label="Callout right"
          value={props.calloutRight ?? ""}
          onChange={(v) => onChange({ ...props, calloutRight: v || undefined })}
          maxLength={200}
        />
      </div>
      <Field label="Hero photo carousel category (optional)">
        <CategoryPicker
          value={props.photoCategorySlug ?? ""}
          onChange={(slug) =>
            onChange({ ...props, photoCategorySlug: slug || undefined })
          }
        />
      </Field>
      <div>
        <div className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          CTAs ({props.ctas.length}/3)
        </div>
        <div className="space-y-3">
          {props.ctas.map((cta, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-card/50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  CTA {i + 1}
                </span>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() =>
                    onChange({
                      ...props,
                      ctas: props.ctas.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Text"
                  value={cta.text}
                  onChange={(v) => updateCta(i, { text: v })}
                  maxLength={80}
                />
                <TextField
                  label="Link"
                  value={cta.href}
                  onChange={(v) => updateCta(i, { href: v })}
                />
              </div>
              <SelectField
                label="Color"
                value={cta.variant}
                onChange={(v) => updateCta(i, { variant: v })}
                options={[
                  { value: "orange", label: "Orange" },
                  { value: "blue", label: "Blue" },
                  { value: "pink", label: "Pink" },
                  { value: "green", label: "Green" },
                  { value: "neutral", label: "Neutral" },
                ]}
              />
            </div>
          ))}
          {props.ctas.length < 3 && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() =>
                onChange({
                  ...props,
                  ctas: [...props.ctas, { text: "Learn more", href: "/", variant: "orange" }],
                })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add CTA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────── Dynamic feeds ────────

function EventFeedEditor({ props, onChange }: BlockEditorProps<"eventFeed">) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Heading (optional)"
        value={props.heading ?? ""}
        onChange={(v) => onChange({ ...props, heading: v || undefined })}
        maxLength={120}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Mode"
          value={props.mode}
          onChange={(v) => onChange({ ...props, mode: v })}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />
        <NumberField
          label="Limit"
          value={props.limit}
          onChange={(v) => onChange({ ...props, limit: v })}
          min={1}
          max={20}
        />
      </div>
      <ToggleField
        label="Show event images"
        value={props.showImages}
        onChange={(v) => onChange({ ...props, showImages: v })}
      />
    </div>
  );
}

function TestimonialRotatorEditor({
  props,
  onChange,
}: BlockEditorProps<"testimonialRotator">) {
  function toggleSource(s: "quotes" | "alumni") {
    const has = props.sources.includes(s);
    const sources = has
      ? props.sources.filter((x) => x !== s)
      : [...props.sources, s];
    if (sources.length === 0) return; // require at least 1
    onChange({ ...props, sources: sources as ["quotes"] | ["alumni"] | ["quotes", "alumni"] });
  }
  return (
    <div className="flex flex-col gap-4">
      <Field label="Sources">
        <div className="flex gap-4">
          <ToggleField
            label="User-submitted quotes"
            value={props.sources.includes("quotes")}
            onChange={() => toggleSource("quotes")}
          />
          <ToggleField
            label="Alumni quotes"
            value={props.sources.includes("alumni")}
            onChange={() => toggleSource("alumni")}
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Count"
          value={props.count}
          onChange={(v) => onChange({ ...props, count: v })}
          min={1}
          max={20}
        />
        <NumberField
          label="Interval (ms)"
          value={props.intervalMs}
          onChange={(v) => onChange({ ...props, intervalMs: v })}
          min={3000}
          max={20000}
          step={500}
        />
      </div>
    </div>
  );
}

function ProjectListEditor({ props, onChange }: BlockEditorProps<"projectList">) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Heading (optional)"
        value={props.heading ?? ""}
        onChange={(v) => onChange({ ...props, heading: v || undefined })}
        maxLength={120}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Mode"
          value={props.mode}
          onChange={(v) => onChange({ ...props, mode: v })}
          options={[
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "all", label: "All" },
          ]}
        />
        <NumberField
          label="Limit"
          value={props.limit}
          onChange={(v) => onChange({ ...props, limit: v })}
          min={1}
          max={20}
        />
      </div>
    </div>
  );
}

function OfficerListingEditor({
  props,
  onChange,
}: BlockEditorProps<"officerListing">) {
  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Position category"
        value={props.positionCategory}
        onChange={(v) => onChange({ ...props, positionCategory: v })}
        options={[
          { value: "PRIMARY_OFFICER", label: "Primary officers" },
          { value: "SE_OFFICE", label: "SE Office" },
          { value: "ALL", label: "All positions" },
        ]}
      />
      <ToggleField
        label="Include defunct positions"
        value={props.showInactive}
        onChange={(v) => onChange({ ...props, showInactive: v })}
      />
    </div>
  );
}

function SponsorWallEditor({ props, onChange }: BlockEditorProps<"sponsorWall">) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Heading (optional)"
        value={props.heading ?? ""}
        onChange={(v) => onChange({ ...props, heading: v || undefined })}
        maxLength={120}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Layout"
          value={props.layout}
          onChange={(v) => onChange({ ...props, layout: v })}
          options={[
            { value: "grid", label: "Grid" },
            { value: "inline", label: "Inline row" },
          ]}
        />
        <Field label="Filter">
          <ToggleField
            label="Active sponsors only"
            value={props.onlyActive}
            onChange={(v) => onChange({ ...props, onlyActive: v })}
          />
        </Field>
      </div>
    </div>
  );
}

function RawHtmlEditor({ props, onChange }: BlockEditorProps<"rawHtml">) {
  const [showWarning, setShowWarning] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      {showWarning && (
        <div className="rounded-md border border-categorical-pink bg-categorical-pink/10 p-3 text-xs">
          <strong className="font-display uppercase tracking-wider">Heads up:</strong>{" "}
          Raw HTML is sanitized — scripts and event handlers are stripped — but
          you can still break a page&apos;s layout. Prefer the markdown block when you can.{" "}
          <button
            onClick={() => setShowWarning(false)}
            className="underline ml-1"
          >
            Got it
          </button>
        </div>
      )}
      <TextAreaField
        label="HTML"
        value={props.html}
        onChange={(v) => onChange({ ...props, html: v })}
        rows={10}
        maxLength={20000}
      />
    </div>
  );
}

// ──────── Registry ────────

// Type-erased registry — see registry.ts for the parallel pattern.
// PageEditorClient hands a block's runtime props back in via
// React.createElement, where the per-block types are known.
type AnyEditor = React.ComponentType<BlockEditorProps<any>>;

export const EDITOR_REGISTRY: Record<BlockType, AnyEditor> = {
  heading: HeadingEditor as AnyEditor,
  markdown: MarkdownEditor as AnyEditor,
  image: ImageEditor as AnyEditor,
  divider: DividerEditor as AnyEditor,
  cta: CtaEditor as AnyEditor,
  photoCarousel: PhotoCarouselEditor as AnyEditor,
  photoGrid: PhotoGridEditor as AnyEditor,
  zCardRow: ZCardRowEditor as AnyEditor,
  heroSection: HeroSectionEditor as AnyEditor,
  eventFeed: EventFeedEditor as AnyEditor,
  testimonialRotator: TestimonialRotatorEditor as AnyEditor,
  projectList: ProjectListEditor as AnyEditor,
  officerListing: OfficerListingEditor as AnyEditor,
  sponsorWall: SponsorWallEditor as AnyEditor,
  rawHtml: RawHtmlEditor as AnyEditor,
};

export function getEditor(type: BlockType) {
  return EDITOR_REGISTRY[type] ?? null;
}
