"use client";

import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Segment = {
  label: string;
  value: number;
  cssVar: string;
  hoverCssVar: string;
};

type VotePieChartProps = {
  approve: number;
  reject: number;
  notVoted: number;
  size?: number;
  strokeWidth?: number;
};

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArc, 0, end.x, end.y,
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function VotePieChart({
  approve,
  reject,
  notVoted,
  size = 200,
  strokeWidth = 32,
}: VotePieChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = approve + reject + notVoted;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  const segments: Segment[] = useMemo(
    () => [
      {
        label: "Approve",
        value: approve,
        cssVar: "hsl(var(--vote-approve))",
        hoverCssVar: "hsl(var(--vote-approve-hover))",
      },
      {
        label: "Reject",
        value: reject,
        cssVar: "hsl(var(--vote-reject))",
        hoverCssVar: "hsl(var(--vote-reject-hover))",
      },
      {
        label: "Not voted",
        value: notVoted,
        cssVar: "hsl(var(--vote-not-voted))",
        hoverCssVar: "hsl(var(--vote-not-voted-hover))",
      },
    ],
    [approve, reject, notVoted],
  );

  const arcs = useMemo(() => {
    if (total === 0) return [];
    let cumAngle = 0;
    return segments
      .filter((s) => s.value > 0)
      .map((seg) => {
        const sweep = (seg.value / total) * 360;
        const startAngle = cumAngle;
        cumAngle += sweep;
        const endAngle = Math.min(cumAngle, 360);
        const pct = Math.round((seg.value / total) * 100);
        return { ...seg, startAngle, endAngle, sweep, pct };
      });
  }, [segments, total]);

  if (total === 0) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--vote-not-voted))"
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
        </svg>
        <span className="absolute text-sm text-muted-foreground font-medium">
          No votes
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className="relative flex items-center justify-center overflow-visible"
        style={{ width: size, height: size }}
      >
        <svg
          width={size + 8}
          height={size + 8}
          viewBox={`-4 -4 ${size + 8} ${size + 8}`}
          className="drop-shadow-sm overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--vote-not-voted))"
            strokeWidth={strokeWidth}
            opacity={0.1}
          />

          {arcs.map((arc) => {
            const isHovered = hovered === arc.label;
            const color = isHovered ? arc.hoverCssVar : arc.cssVar;
            const width = isHovered ? strokeWidth + 4 : strokeWidth;

            // Full circle edge case
            if (arc.sweep >= 359.99) {
              return (
                <Tooltip key={arc.label}>
                  <TooltipTrigger asChild>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={color}
                      strokeWidth={width}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHovered(arc.label)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{arc.label}</p>
                    <p>
                      {arc.value} vote{arc.value !== 1 ? "s" : ""} ({arc.pct}%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            const path = describeArc(cx, cy, r, arc.startAngle, arc.endAngle);
            return (
              <Tooltip key={arc.label}>
                <TooltipTrigger asChild>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={width}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHovered(arc.label)}
                    onMouseLeave={() => setHovered(null)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{arc.label}</p>
                  <p>
                    {arc.value} vote{arc.value !== 1 ? "s" : ""} ({arc.pct}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-display font-bold leading-none tabular-nums">
            {approve + reject}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
            votes cast
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
