"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Custom hover-follow tooltip (used by mentoring schedule etc.)      */
/* ------------------------------------------------------------------ */

const SIZE_CLASS_NAMES = {
  sm: "w-48",
  md: "w-64",
  lg: "w-80",
} as const;

type TooltipSize = keyof typeof SIZE_CLASS_NAMES;

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  size?: TooltipSize;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

function Tooltip({
  children,
  content,
  size = "md",
  disabled = false,
  className,
  contentClassName,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const coordsRef = React.useRef({ x: 0, y: 0 });
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [mounted, setMounted] = React.useState(false);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    setMounted(true);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    coordsRef.current = { x: e.clientX, y: e.clientY };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setCoords(coordsRef.current);
        rafRef.current = 0;
      });
    }
  }, []);

  const handlePointerEnter = React.useCallback((e: React.PointerEvent) => {
    coordsRef.current = { x: e.clientX, y: e.clientY };
    setCoords({ x: e.clientX, y: e.clientY });
    setOpen(true);
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    setOpen(false);
  }, []);

  if (disabled) return <>{children}</>;

  return (
    <>
      <div
        className={cn(className)}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
      >
        {children}
      </div>
      {open &&
        mounted &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[9999] rounded-md border border-border/50 bg-background/95 px-2.5 py-1.5 text-xs text-foreground shadow-lg backdrop-blur-sm",
              SIZE_CLASS_NAMES[size],
              contentClassName
            )}
            style={{
              left: coords.x + 12,
              top: coords.y - 8,
              willChange: "left, top",
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Radix tooltip (used by amendment components etc.)                   */
/* ------------------------------------------------------------------ */

const TooltipProvider = TooltipPrimitive.Provider;

function RadixTooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "neo:rounded-base neo:border-2 neo:border-border neo:bg-popover neo:text-popover-foreground neo:shadow-md",
          "clean:rounded-md clean:border clean:border-border/30 clean:bg-popover clean:text-popover-foreground clean:shadow-lg",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export {
  Tooltip,
  RadixTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};
