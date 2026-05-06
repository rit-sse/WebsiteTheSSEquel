"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Bold, Italic, Link as LinkIcon, List } from "lucide-react";

interface Props {
  value: string;
  onCommit: (next: string) => void;
  align?: "left" | "center";
  disabled?: boolean;
  onActivate?: () => void;
  /** When true, the editor opens immediately (controlled by parent
   *  selection). When false, double-click toggles edit mode. */
  forceEdit?: boolean;
}

/**
 * InlineMarkdown — sanitized markdown view that swaps to a textarea +
 * micro-toolbar on double-click. Toolbar wraps selected text with
 * markdown syntax (bold / italic / link / bullet list).
 *
 * Commits the textarea value to `onCommit` on blur or when the user
 * clicks outside. Escape reverts.
 */
export function InlineMarkdown({
  value,
  onCommit,
  align = "left",
  disabled,
  onActivate,
  forceEdit = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (forceEdit && !editing && !disabled) {
      setEditing(true);
    }
  }, [forceEdit, editing, disabled]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  function commit() {
    if (draft !== value) onCommit(draft);
    setEditing(false);
  }

  function wrapSelection(prefix: string, suffix = prefix) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = draft.slice(0, start);
    const sel = draft.slice(start, end) || "text";
    const after = draft.slice(end);
    const next = `${before}${prefix}${sel}${suffix}${after}`;
    setDraft(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        start + prefix.length,
        start + prefix.length + sel.length,
      );
    });
  }

  function prefixLines(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = draft.slice(0, start);
    const sel = draft.slice(start, end) || "item";
    const after = draft.slice(end);
    const next =
      before +
      sel
        .split("\n")
        .map((l) => (l.length ? `${prefix}${l}` : l))
        .join("\n") +
      after;
    setDraft(next);
    requestAnimationFrame(() => ta.focus());
  }

  if (editing) {
    return (
      <div
        ref={containerRef}
        className={[
          "my-6 rounded-md border-2 border-foreground/30 bg-background/40 p-3 shadow-sm",
          align === "center" ? "mx-auto max-w-3xl" : "max-w-none",
        ].join(" ")}
        onBlur={(e) => {
          if (
            containerRef.current &&
            !containerRef.current.contains(e.relatedTarget as Node)
          ) {
            commit();
          }
        }}
      >
        <div className="mb-2 flex items-center gap-1 border-b border-border/40 pb-2">
          <ToolbarButton
            label="Bold"
            onClick={() => wrapSelection("**")}
            icon={<Bold className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            label="Italic"
            onClick={() => wrapSelection("*")}
            icon={<Italic className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            label="Link"
            onClick={() => wrapSelection("[", "](https://)")}
            icon={<LinkIcon className="h-3.5 w-3.5" />}
          />
          <ToolbarButton
            label="Bullet"
            onClick={() => prefixLines("- ")}
            icon={<List className="h-3.5 w-3.5" />}
          />
          <span className="ml-auto text-[10px] text-muted-foreground">
            Click outside to save · Esc to cancel
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          rows={Math.max(4, draft.split("\n").length + 1)}
          className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed outline-none"
          spellCheck
        />
      </div>
    );
  }

  // Reading mode
  if (!value.trim()) {
    return (
      <div
        className={[
          "my-6 rounded-md border border-dashed border-border/40 p-4 text-sm italic text-muted-foreground",
          align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-none",
          disabled ? "" : "cursor-text hover:border-foreground/40",
        ].join(" ")}
        onClick={onActivate}
        onDoubleClick={() => !disabled && setEditing(true)}
      >
        Empty text block — double-click to edit.
      </div>
    );
  }

  return (
    <div
      className={[
        "prose prose-neutral dark:prose-invert mb-6 last:mb-0",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-none",
        disabled ? "" : "cursor-text hover:ring-2 hover:ring-foreground/15 rounded-sm",
      ].join(" ")}
      onClick={onActivate}
      onDoubleClick={() => !disabled && setEditing(true)}
      title={disabled ? undefined : "Double-click to edit"}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded p-1.5 text-muted-foreground hover:bg-surface-1 hover:text-foreground"
    >
      {icon}
    </button>
  );
}
