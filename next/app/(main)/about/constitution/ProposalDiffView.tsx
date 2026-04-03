"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

function getLineClass(line: string) {
  if (line.startsWith("@@")) {
    return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
  if (line.startsWith("+") && !line.startsWith("+++")) {
    return "bg-green-500/10 text-green-700 dark:text-green-300";
  }
  if (line.startsWith("-") && !line.startsWith("---")) {
    return "bg-red-500/10 text-red-700 dark:text-red-300";
  }
  if (line.startsWith("+++") || line.startsWith("---")) {
    return "bg-muted/60 text-muted-foreground";
  }
  return "text-foreground";
}

type DiffLine =
  | {
      kind: "plain";
      text: string;
      className: string;
    }
  | {
      kind: "pair";
      removed: string;
      added: string;
      removedClassName: string;
      addedClassName: string;
    };

function getWordSegments(source: string, target: string) {
  const tokenize = (value: string) =>
    value.match(/\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]+/g) ?? [value];
  const sourceTokens = tokenize(source);
  const targetTokens = tokenize(target);
  let prefixLength = 0;

  while (
    prefixLength < sourceTokens.length &&
    prefixLength < targetTokens.length &&
    sourceTokens[prefixLength] === targetTokens[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < sourceTokens.length - prefixLength &&
    suffixLength < targetTokens.length - prefixLength &&
    sourceTokens[sourceTokens.length - 1 - suffixLength] ===
      targetTokens[targetTokens.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const buildSegments = (tokens: string[], changedStart: number, changedEnd: number) =>
    tokens.map((token, index) => ({
      value: token,
      changed: index >= changedStart && index < changedEnd,
    }));

  const removed = buildSegments(
    sourceTokens,
    prefixLength,
    sourceTokens.length - suffixLength
  );
  const added = buildSegments(
    targetTokens,
    prefixLength,
    targetTokens.length - suffixLength
  );

  return { removed, added };
}

function buildRenderableLines(lines: string[]): DiffLine[] {
  const renderable: DiffLine[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const isRemoval = line.startsWith("-") && !line.startsWith("---");

    if (!isRemoval) {
      renderable.push({
        kind: "plain",
        text: line,
        className: getLineClass(line),
      });
      continue;
    }

    const removedBlock: string[] = [];
    const addedBlock: string[] = [];

    while (
      index < lines.length &&
      lines[index]?.startsWith("-") &&
      !lines[index]?.startsWith("---")
    ) {
      removedBlock.push(lines[index] as string);
      index += 1;
    }

    while (
      index < lines.length &&
      lines[index]?.startsWith("+") &&
      !lines[index]?.startsWith("+++")
    ) {
      addedBlock.push(lines[index] as string);
      index += 1;
    }

    const pairCount = Math.min(removedBlock.length, addedBlock.length);

    for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
      renderable.push({
        kind: "pair",
        removed: removedBlock[pairIndex] as string,
        added: addedBlock[pairIndex] as string,
        removedClassName: getLineClass(removedBlock[pairIndex] as string),
        addedClassName: getLineClass(addedBlock[pairIndex] as string),
      });
    }

    for (let pairIndex = pairCount; pairIndex < removedBlock.length; pairIndex += 1) {
      const removed = removedBlock[pairIndex] as string;
      renderable.push({
        kind: "plain",
        text: removed,
        className: getLineClass(removed),
      });
    }

    for (let pairIndex = pairCount; pairIndex < addedBlock.length; pairIndex += 1) {
      const added = addedBlock[pairIndex] as string;
      renderable.push({
        kind: "plain",
        text: added,
        className: getLineClass(added),
      });
    }

    index -= 1;
  }

  return renderable;
}

function renderHighlightedLine(
  prefix: string,
  text: string,
  segments: Array<{ value: string; changed: boolean }>,
  highlightClassName: string
) {
  return (
    <>
      <span className="select-none">{prefix}</span>
      {segments.map((segment, index) => (
        <span
          key={`${prefix}-${text.length}-${index}-${segment.value}`}
          className={segment.changed ? highlightClassName : undefined}
        >
          {segment.value}
        </span>
      ))}
    </>
  );
}

export function ProposalDiffView({
  diff,
  className,
}: {
  diff: string;
  className?: string;
}) {
  const lines = diff.split("\n");
  const renderableLines = buildRenderableLines(lines);

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border bg-card/60 font-mono text-xs",
        className
      )}
    >
      <div className="min-w-full divide-y divide-border/50">
        {renderableLines.map((line, index) => {
          if (line.kind === "plain") {
            return (
              <div
                key={`${index}-${line.text}`}
                className={cn(
                  "whitespace-pre-wrap break-words px-3 py-1.5",
                  line.className
                )}
              >
                {line.text || " "}
              </div>
            );
          }

          const removedText = line.removed.slice(1);
          const addedText = line.added.slice(1);
          const segments = getWordSegments(removedText, addedText);

          return (
            <Fragment key={`${index}-${line.removed}-${line.added}`}>
              <div
                className={cn(
                  "whitespace-pre-wrap break-words px-3 py-1.5",
                  line.removedClassName
                )}
              >
                {renderHighlightedLine(
                  "-",
                  removedText,
                  segments.removed,
                  "rounded-[3px] bg-red-500/25 font-semibold text-red-950 dark:text-red-50"
                )}
              </div>
              <div
                className={cn(
                  "whitespace-pre-wrap break-words px-3 py-1.5",
                  line.addedClassName
                )}
              >
                {renderHighlightedLine(
                  "+",
                  addedText,
                  segments.added,
                  "rounded-[3px] bg-green-500/25 font-semibold text-green-950 dark:text-green-50"
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
