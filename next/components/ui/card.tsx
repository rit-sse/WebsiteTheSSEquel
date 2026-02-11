import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "text-card-foreground",
  {
    variants: {
      depth: {
        // Depth 1: Full neo-brutalist statement — sits on page background (surface-2)
        1: [
          "bg-surface-2",
          "neo:rounded-xl neo:border-2 neo:border-black neo:shadow-shadow",
          "clean:rounded-lg clean:border clean:border-border/30 clean:shadow-md",
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
        // Depth 4: Minimal — same as depth-3, just rounding.
        4: [
          "bg-surface-4",
          "neo:rounded-lg",
          "clean:rounded-lg",
        ].join(" "),
      },
    },
    defaultVariants: {
      depth: 1,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, depth, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ depth }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-display text-xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
