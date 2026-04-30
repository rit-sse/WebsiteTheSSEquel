import { describe, expect, it } from "vitest";
import {
  PageContentSchema,
  validateSlug,
  autoDescribe,
  EMPTY_PAGE_CONTENT,
  RESERVED_SLUG_PREFIXES,
} from "@/lib/pageBuilder/blocks";
import { contentHash, canonicalJson } from "@/lib/pageBuilder/hash";

describe("PageContentSchema", () => {
  it("accepts an empty content envelope", () => {
    const parsed = PageContentSchema.safeParse(EMPTY_PAGE_CONTENT);
    expect(parsed.success).toBe(true);
  });

  it("validates a heading block end-to-end", () => {
    const content = {
      version: 1,
      blocks: [
        {
          id: "1",
          type: "heading",
          props: { text: "Hello", level: 2, align: "left" },
        },
      ],
    };
    const parsed = PageContentSchema.safeParse(content);
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown block type", () => {
    const content = {
      version: 1,
      blocks: [{ id: "x", type: "totallyMadeUp", props: {} }],
    };
    const parsed = PageContentSchema.safeParse(content);
    expect(parsed.success).toBe(false);
  });

  it("rejects a block with malformed props", () => {
    // photoCarousel.count must be 1..30; passing 0 should fail
    const content = {
      version: 1,
      blocks: [
        {
          id: "1",
          type: "photoCarousel",
          props: {
            categorySlug: "events",
            count: 0,
            intervalMs: 6000,
            aspectRatio: "16:9",
            showCaptions: false,
            order: "random",
          },
        },
      ],
    };
    const parsed = PageContentSchema.safeParse(content);
    expect(parsed.success).toBe(false);
  });
});

describe("validateSlug", () => {
  it.each(["about", "about/get-involved", "lab-rules", "a/b/c-d"])(
    "accepts valid slug %s",
    (s) => {
      const r = validateSlug(s);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.slug).toBe(s);
    }
  );

  it.each(["", "with spaces", "/leading", "trailing/", "double--dash", "UPPER!case"])(
    "rejects invalid slug %s",
    (s) => {
      const r = validateSlug(s);
      expect(r.ok).toBe(false);
    }
  );

  it("rejects every reserved prefix", () => {
    for (const p of RESERVED_SLUG_PREFIXES) {
      const r = validateSlug(p === "home-" ? "home-anything" : p);
      expect(r.ok).toBe(false);
    }
  });

  it("normalizes case", () => {
    const r = validateSlug("AboUt");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.slug).toBe("about");
  });
});

describe("autoDescribe", () => {
  it("falls back to the page title when content is null", () => {
    expect(autoDescribe(null, "My Page")).toBe("My Page");
  });

  it("returns the first markdown body, stripped of formatting", () => {
    const out = autoDescribe(
      {
        version: 1,
        blocks: [
          {
            id: "1",
            type: "markdown",
            props: { body: "**Hello** [there](https://x)." },
          },
        ],
      },
      "fallback"
    );
    expect(out).toBe("Hello there.");
  });

  it("uses the heroSection description when no markdown is present", () => {
    const out = autoDescribe(
      {
        version: 1,
        blocks: [
          {
            id: "1",
            type: "heroSection",
            props: {
              title: "T",
              description: "Welcome to SSE — the Society for Software Engineers.",
              ctas: [],
            },
          },
        ],
      },
      "fallback"
    );
    expect(out).toMatch(/^Welcome to SSE/);
  });

  it("truncates to ~160 chars with an ellipsis", () => {
    const long = "x".repeat(300);
    const out = autoDescribe(
      {
        version: 1,
        blocks: [
          { id: "1", type: "markdown", props: { body: long } },
        ],
      },
      "fallback"
    );
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("contentHash", () => {
  it("is stable across key insertion order", () => {
    const a = { z: 1, a: { b: 2, c: 3 } };
    const b = { a: { c: 3, b: 2 }, z: 1 };
    expect(contentHash(a)).toBe(contentHash(b));
  });

  it("is sensitive to value changes", () => {
    const a = { v: 1 };
    const b = { v: 2 };
    expect(contentHash(a)).not.toBe(contentHash(b));
  });

  it("returns 64 hex chars", () => {
    expect(contentHash({ x: "y" })).toMatch(/^[0-9a-f]{64}$/);
  });

  it("canonicalJson sorts keys deterministically", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
});
