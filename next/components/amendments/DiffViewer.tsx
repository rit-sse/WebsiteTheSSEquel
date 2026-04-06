"use client";

import { useMemo, useState } from "react";
import { diffLines, diffWords } from "diff";
import { ChevronDown, ChevronRight } from "lucide-react";

type DiffLine = {
  type: "added" | "removed" | "unchanged";
  leftLine: number | null;
  rightLine: number | null;
  content: string;
  /** The paired line from the other side (for word-level diffing) */
  pairedContent?: string;
};

type DisplayRow =
  | { kind: "line"; data: DiffLine }
  | { kind: "collapsed"; count: number; startIdx: number };

const CONTEXT_LINES = 3;
const COLLAPSE_THRESHOLD = 6;

function buildLineRows(original: string, proposed: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let originalLine = 1;
  let proposedLine = 1;

  const patches = diffLines(original, proposed);

  // Collect removed and added blocks to pair them for word-level diff
  const tempLines: DiffLine[] = [];

  for (const patch of patches) {
    const changeType: DiffLine["type"] = patch.added
      ? "added"
      : patch.removed
        ? "removed"
        : "unchanged";
    const splitLines = (patch.value as string).split(/\r?\n/);
    const allLines = splitLines.every((line: string) => line === "") ? [] : splitLines;

    for (const contentLine of allLines) {
      if (changeType === "removed") {
        tempLines.push({ type: "removed", leftLine: originalLine++, rightLine: null, content: contentLine });
        continue;
      }
      if (changeType === "added") {
        tempLines.push({ type: "added", leftLine: null, rightLine: proposedLine++, content: contentLine });
        continue;
      }
      tempLines.push({
        type: "unchanged",
        leftLine: originalLine++,
        rightLine: proposedLine++,
        content: contentLine,
      });
    }
  }

  // Pair consecutive removed/added lines for word-level highlighting
  let i = 0;
  while (i < tempLines.length) {
    if (tempLines[i].type === "removed") {
      // Collect the removed block
      const removedBlock: DiffLine[] = [];
      while (i < tempLines.length && tempLines[i].type === "removed") {
        removedBlock.push(tempLines[i]);
        i++;
      }
      // Collect the added block
      const addedBlock: DiffLine[] = [];
      while (i < tempLines.length && tempLines[i].type === "added") {
        addedBlock.push(tempLines[i]);
        i++;
      }

      // Pair them up for word-level diff
      const pairCount = Math.min(removedBlock.length, addedBlock.length);
      for (let j = 0; j < pairCount; j++) {
        removedBlock[j].pairedContent = addedBlock[j].content;
        addedBlock[j].pairedContent = removedBlock[j].content;
      }

      lines.push(...removedBlock, ...addedBlock);
    } else {
      lines.push(tempLines[i]);
      i++;
    }
  }

  return lines;
}

function buildDisplayRows(lines: DiffLine[], expandedSections: Set<number>): DisplayRow[] {
  const rows: DisplayRow[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.type !== "unchanged") {
      rows.push({ kind: "line", data: line });
      i++;
      continue;
    }

    let runStart = i;
    while (i < lines.length && lines[i].type === "unchanged") {
      i++;
    }
    const runEnd = i;

    if (runEnd - runStart <= COLLAPSE_THRESHOLD) {
      for (let j = runStart; j < runEnd; j++) {
        rows.push({ kind: "line", data: lines[j] });
      }
      continue;
    }

    if (expandedSections.has(runStart)) {
      for (let j = runStart; j < runEnd; j++) {
        rows.push({ kind: "line", data: lines[j] });
      }
      continue;
    }

    const contextBefore = Math.min(CONTEXT_LINES, runEnd - runStart);
    const contextAfter = Math.min(CONTEXT_LINES, runEnd - runStart - contextBefore);
    const collapsedCount = runEnd - runStart - contextBefore - contextAfter;

    for (let j = runStart; j < runStart + contextBefore; j++) {
      rows.push({ kind: "line", data: lines[j] });
    }

    if (collapsedCount > 0) {
      rows.push({ kind: "collapsed", count: collapsedCount, startIdx: runStart });
    }

    for (let j = runEnd - contextAfter; j < runEnd; j++) {
      rows.push({ kind: "line", data: lines[j] });
    }
  }

  return rows;
}

function lineClassName(type: DiffLine["type"]) {
  if (type === "added") return "bg-emerald-500/10 dark:bg-emerald-900/20";
  if (type === "removed") return "bg-rose-500/10 dark:bg-rose-900/20";
  return "bg-transparent";
}

/** Render line content with word-level highlights for paired lines */
function WordHighlightedContent({
  content,
  pairedContent,
  type,
}: {
  content: string;
  pairedContent?: string;
  type: DiffLine["type"];
}) {
  if (!pairedContent || type === "unchanged") {
    return (
      <pre className="whitespace-pre-wrap break-words font-mono text-sm">
        {content}
      </pre>
    );
  }

  // Compute word-level diff between paired lines
  const oldText = type === "removed" ? content : pairedContent;
  const newText = type === "removed" ? pairedContent : content;
  const wordDiffs = diffWords(oldText, newText);

  const highlightClass =
    type === "added"
      ? "bg-emerald-400/30 dark:bg-emerald-400/20 rounded-sm px-[1px]"
      : "bg-rose-400/30 dark:bg-rose-400/20 rounded-sm px-[1px]";

  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-sm">
      {wordDiffs.map((part: { added?: boolean; removed?: boolean; value: string }, idx: number) => {
        const isRelevant =
          (type === "removed" && part.removed) ||
          (type === "added" && part.added);
        const isOpposite =
          (type === "removed" && part.added) ||
          (type === "added" && part.removed);

        // Skip parts that belong to the other side
        if (isOpposite) return null;

        if (isRelevant) {
          return (
            <span key={idx} className={highlightClass}>
              {part.value}
            </span>
          );
        }

        // Unchanged part
        if (!part.added && !part.removed) {
          return <span key={idx}>{part.value}</span>;
        }

        return null;
      })}
    </pre>
  );
}

export default function DiffViewer({
  originalContent,
  proposedContent,
}: {
  originalContent: string;
  proposedContent: string;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const lines = useMemo(
    () => buildLineRows(originalContent, proposedContent),
    [originalContent, proposedContent],
  );

  const displayRows = useMemo(
    () => buildDisplayRows(lines, expandedSections),
    [lines, expandedSections],
  );

  const addedCount = lines.filter((l) => l.type === "added").length;
  const removedCount = lines.filter((l) => l.type === "removed").length;

  function expandSection(startIdx: number) {
    setExpandedSections((prev) => new Set(prev).add(startIdx));
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* File header */}
      <div className="bg-surface-2 px-4 py-2 flex items-center justify-between border-b border-border">
        <span className="text-sm font-semibold font-mono">constitution.md</span>
        <div className="flex items-center gap-3 text-xs font-mono">
          {addedCount > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">+{addedCount}</span>
          )}
          {removedCount > 0 && (
            <span className="text-rose-700 dark:text-rose-400 font-semibold">-{removedCount}</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <tbody>
            {displayRows.map((row, index) => {
              if (row.kind === "collapsed") {
                return (
                  <tr key={`collapsed-${row.startIdx}`}>
                    <td colSpan={4} className="px-0 py-0">
                      <button
                        type="button"
                        onClick={() => expandSection(row.startIdx)}
                        className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-primary/70 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer border-y border-primary/10"
                      >
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-mono">{row.count} unchanged lines</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              }

              const line = row.data;
              return (
                <tr
                  key={`${line.type}-${index}-${line.leftLine ?? 0}-${line.rightLine ?? 0}`}
                  className={lineClassName(line.type)}
                >
                  <td className="w-10 px-2 py-1 tabular-nums text-muted-foreground text-right select-none hidden sm:table-cell text-xs">
                    {line.leftLine ?? ""}
                  </td>
                  <td className="w-10 px-2 py-1 tabular-nums text-muted-foreground text-right select-none hidden sm:table-cell text-xs">
                    {line.rightLine ?? ""}
                  </td>
                  <td className={`w-5 px-1 py-1 text-center select-none text-xs font-mono font-bold ${
                    line.type === "added"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : line.type === "removed"
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-transparent"
                  }`}>
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : ""}
                  </td>
                  <td className="px-3 py-0.5">
                    <WordHighlightedContent
                      content={line.content}
                      pairedContent={line.pairedContent}
                      type={line.type}
                    />
                  </td>
                </tr>
              );
            })}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-muted-foreground text-center">
                  No changes to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
