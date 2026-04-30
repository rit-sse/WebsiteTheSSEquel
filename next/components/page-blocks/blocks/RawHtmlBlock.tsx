/**
 * RawHtmlBlock — escape hatch for hand-rolled markup.
 *
 * Officer-only at the editor level (registry sets `primaryOnly`).
 * Sanitized with a unified pipeline that strips scripts, event
 * handlers, and dangerous attributes — same posture as the markdown
 * renderer. Officers shouldn't need this block often, but when they do
 * (embedding a special form, custom CSS-only widget, etc.) it beats
 * waiting for a code change.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { BlockRenderProps } from "../types";

const sanitizer = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSanitize)
  .use(rehypeStringify, { allowDangerousHtml: false });

export async function RawHtmlBlock({ props }: BlockRenderProps<"rawHtml">) {
  if (!props.html.trim()) return null;
  const file = await sanitizer.process(props.html);
  return (
    <div
      className="my-6"
      dangerouslySetInnerHTML={{ __html: String(file.value) }}
    />
  );
}
