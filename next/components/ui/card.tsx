import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "text-card-foreground",
  {
    variants: {
      depth: {
        // Depth 1: Full neo-brutalist statement — page wrappers, hero cards
        1: [
          "bg-surface-1",
          "neo:rounded-xl neo:border-2 neo:border-black neo:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "clean:rounded-lg clean:border clean:border-border/30 clean:shadow-md",
        ].join(" "),
        // Depth 2: Quiet container — inner cards, data tables. No neo shadow.
        2: [
          "bg-surface-2",
          "neo:rounded-xl neo:border neo:border-black/25",
          "clean:rounded-lg clean:border clean:border-border/20 clean:shadow-sm",
        ].join(" "),
        // Depth 3: Subtle — deeply nested items. Lightest border.
        3: [
          "bg-surface-3",
          "neo:rounded-lg neo:border neo:border-black/15",
          "clean:rounded-lg clean:border clean:border-border/10",
        ].join(" "),
        // Depth 4: Minimal — just background color + rounding.
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
