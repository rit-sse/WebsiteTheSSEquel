"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neoCardVariants = cva(
  "text-card-foreground",
  {
    variants: {
      depth: {
        // Depth 1: Full neo-brutalist statement — sits on the page background (surface-2)
        1: [
          "bg-surface-2",
          "depth1-thick-border",
          "neo:rounded-xl neo:border-2 neo:border-black neo:shadow-shadow",
          "clean:rounded-lg clean:border clean:border-border/30 clean:shadow-lg",
        ].join(" "),
        // Depth 2: Quiet container — inner cards inside depth-1 (surface-3)
        2: [
          "bg-surface-3",
          "neo:rounded-xl neo:border-2 neo:border-foreground/20",
          "clean:rounded-lg clean:border clean:border-foreground/15 clean:shadow-sm",
        ].join(" "),
        // Depth 3: Emphasis — deeply nested / overlays (surface-4)
        3: [
          "bg-surface-4",
          "neo:rounded-lg neo:border neo:border-foreground/18",
          "clean:rounded-lg clean:border clean:border-foreground/12",
        ].join(" "),
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
