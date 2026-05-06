import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { BlockRenderProps } from "../types";

/**
 * Markdown body. Sanitized with rehype-sanitize so officer-edited
 * content can never inject scripts. GitHub-flavored markdown
 * (tables, task lists, autolinks) is supported.
 */
export function MarkdownBlock({ props }: BlockRenderProps<"markdown">) {
  if (!props.body.trim()) {
    return null;
  }
  const centered = props.align === "center";
  return (
    <div
      className={[
        "prose prose-neutral dark:prose-invert mb-6 last:mb-0",
        centered ? "mx-auto max-w-3xl text-center" : "max-w-none",
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {props.body}
      </ReactMarkdown>
    </div>
  );
}
