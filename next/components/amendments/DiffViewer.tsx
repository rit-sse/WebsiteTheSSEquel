"use client";

import { useMemo } from "react";
import { diffLines } from "diff";

type DiffLine = {
  type: "added" | "removed" | "unchanged";
  leftLine: number | null;
  rightLine: number | null;
  content: string;
};

function buildLineRows(
  original: string,
  proposed: string,
): DiffLine[] {
  const lines: DiffLine[] = [];
  let originalLine = 1;
  let proposedLine = 1;

  const patches = diffLines(original, proposed);

  for (const patch of patches) {
    const changeType: DiffLine["type"] =
      patch.added ? "added" : patch.removed ? "removed" : "unchanged";
    const splitLines = patch.value.split(/\r?\n/);
    const allLines = splitLines.every((line) => line === "") ? [] : splitLines;

    for (const contentLine of allLines) {
      if (changeType === "removed") {
        lines.push({
          type: "removed",
          leftLine: originalLine++,
          rightLine: null,
          content: contentLine,
        });
        continue;
      }

      if (changeType === "added") {
        lines.push({
          type: "added",
          leftLine: null,
          rightLine: proposedLine++,
          content: contentLine,
        });
        continue;
      }

      lines.push({
        type: "unchanged",
        leftLine: originalLine++,
        rightLine: proposedLine++,
        content: contentLine,
      });
    }
  }

  return lines;
}

function lineClassName(type: DiffLine["type"]) {
  if (type === "added") return "bg-emerald-200/25 dark:bg-emerald-900/30";
  if (type === "removed") return "bg-rose-200/35 dark:bg-rose-900/30";
  return "bg-transparent";
}

export default function DiffViewer({
  originalContent,
  proposedContent,
}: {
  originalContent: string;
  proposedContent: string;
}) {
  const rows = useMemo(
    () => buildLineRows(originalContent, proposedContent),
    [originalContent, proposedContent],
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-surface-2 px-4 py-2 text-sm font-semibold border-b border-border">
        Inline diff
      </div>
      <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-surface-3 text-left">
              <th className="w-16 px-3 py-2 text-muted-foreground">Old</th>
              <th className="w-16 px-3 py-2 text-muted-foreground">New</th>
              <th className="px-3 py-2 text-muted-foreground">Line</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.type}-${index}-${row.leftLine ?? 0}-${row.rightLine ?? 0}`}
                className={`${lineClassName(row.type)}`}
              >
                <td className="w-16 px-3 py-1 tabular-nums text-muted-foreground text-right">
                  {row.leftLine === null ? "—" : row.leftLine}
                </td>
                <td className="w-16 px-3 py-1 tabular-nums text-muted-foreground text-right">
                  {row.rightLine === null ? "—" : row.rightLine}
                </td>
                <td className="px-3 py-1">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                    {row.content}
                  </pre>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-muted-foreground">
                  No changes to display.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
