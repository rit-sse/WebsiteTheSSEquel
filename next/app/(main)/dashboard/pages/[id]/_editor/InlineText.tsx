"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** When true the element renders an `<input>` so Enter commits and
   *  newlines are blocked. Use for headings and titles. */
  singleLine?: boolean;
  /** Tag to render when not editing (h1..h4, span, etc.). */
  as?: keyof React.JSX.IntrinsicElements;
  disabled?: boolean;
  /** When true, clicking once enters edit mode (instead of double-click).
   *  Useful for the page title in the top bar. */
  editOnClick?: boolean;
  /** Forward selection events back to the parent so a click inside the
   *  text also selects the surrounding block. */
  onActivate?: () => void;
}

/**
 * InlineText — a tiny text editor primitive.
 *
 * Reading mode shows the value rendered with the chosen `as` tag and
 * className. Double-click (or single-click when `editOnClick`) swaps
 * to a focused input/textarea. Enter or blur commits via `onCommit`.
 * Escape reverts.
 */
export function InlineText({
  value,
  onCommit,
  className,
  placeholder = "Click to edit",
  ariaLabel,
  singleLine = true,
  as = "span",
  disabled,
  editOnClick,
  onActivate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (!editing) return;
    const el = singleLine ? inputRef.current : textareaRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, [editing, singleLine]);

  function commit() {
    const next = draft.trim();
    if (next && next !== value) {
      onCommit(next);
    } else if (next !== value) {
      // empty draft — revert
      setDraft(value);
    }
    setEditing(false);
  }

  function startEditing(e: React.MouseEvent | React.KeyboardEvent) {
    if (disabled) return;
    if (onActivate) onActivate();
    if (editing) return;
    e.preventDefault?.();
    setEditing(true);
  }

  if (editing) {
    if (singleLine) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className={[
            "rounded-sm bg-background/40 outline-none ring-2 ring-foreground/40 focus:ring-foreground",
            className ?? "",
          ].join(" ")}
        />
      );
    }
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={[
          "w-full resize-y rounded-sm bg-background/40 outline-none ring-2 ring-foreground/40 focus:ring-foreground",
          className ?? "",
        ].join(" ")}
        rows={3}
      />
    );
  }

  const Tag = as as React.ElementType;
  const isEmpty = !value.trim();
  const handleClick = (e: React.MouseEvent) => {
    if (editOnClick) startEditing(e);
    else if (onActivate) onActivate();
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!editOnClick) startEditing(e);
  };

  return (
    <Tag
      className={[
        className ?? "",
        disabled
          ? "cursor-default"
          : editOnClick
            ? "cursor-text hover:ring-2 hover:ring-foreground/20 rounded-sm"
            : "cursor-text hover:ring-2 hover:ring-foreground/20 rounded-sm",
        isEmpty ? "text-muted-foreground italic" : "",
      ].join(" ")}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role={disabled ? undefined : "textbox"}
      tabIndex={disabled ? undefined : 0}
      aria-label={ariaLabel}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === "F2") {
          startEditing(e);
        }
      }}
    >
      {isEmpty ? placeholder : value}
    </Tag>
  );
}
