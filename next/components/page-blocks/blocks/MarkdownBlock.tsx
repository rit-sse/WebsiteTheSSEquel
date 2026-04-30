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
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none mb-6 last:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {props.body}
      </ReactMarkdown>
    </div>
  );
}
