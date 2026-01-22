"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neoCardVariants = cva(
  [
    "text-card-foreground",
    // Neo mode: hard shadow, thick border
    "neo:rounded-xl neo:border-2 neo:border-black neo:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    // Clean mode: soft shadow, thin border
    "clean:rounded-lg clean:border clean:border-border/30 clean:shadow-lg",
  ].join(" "),
  {
    variants: {
      depth: {
        1: "bg-surface-1",
        2: "bg-surface-2",
        3: "bg-surface-3",
      },
    },
    defaultVariants: {
      depth: 1,
    },
  }
);

export interface NeoCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof neoCardVariants> {}

const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, depth, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(neoCardVariants({ depth }), className)}
      {...props}
    />
  )
);
NeoCard.displayName = "NeoCard";

const NeoCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
NeoCardHeader.displayName = "NeoCardHeader";

const NeoCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-display text-2xl leading-none tracking-tight", className)}
    {...props}
  />
));
NeoCardTitle.displayName = "NeoCardTitle";

const NeoCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
NeoCardDescription.displayName = "NeoCardDescription";

const NeoCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
NeoCardContent.displayName = "NeoCardContent";

const NeoCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
NeoCardFooter.displayName = "NeoCardFooter";

export { NeoCard, NeoCardHeader, NeoCardFooter, NeoCardTitle, NeoCardDescription, NeoCardContent };
