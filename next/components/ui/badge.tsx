import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Semantic variants backed by categorical colors
        default:
          "border-transparent bg-chart-1/25 text-foreground",
        secondary:
          "border-transparent bg-chart-9/25 text-foreground",
        destructive:
          "border-transparent bg-chart-3/25 text-foreground",
        outline: "text-foreground",
        accent:
          "border-transparent bg-chart-2/25 text-foreground",
        warning:
          "border-transparent bg-chart-6/30 text-foreground",
        success:
          "border-transparent bg-chart-5/25 text-foreground",
        muted:
          "border-transparent bg-muted text-muted-foreground",

        // Explicit categorical variants (New Tableau 10)
        "cat-1": "border-transparent bg-chart-1/25 text-foreground",   // Blue
        "cat-2": "border-transparent bg-chart-2/25 text-foreground",   // Orange
        "cat-3": "border-transparent bg-chart-3/25 text-foreground",   // Red
        "cat-4": "border-transparent bg-chart-4/25 text-foreground",   // Teal
        "cat-5": "border-transparent bg-chart-5/25 text-foreground",   // Green
        "cat-6": "border-transparent bg-chart-6/30 text-foreground",   // Yellow
        "cat-7": "border-transparent bg-chart-7/25 text-foreground",   // Purple
        "cat-8": "border-transparent bg-chart-8/25 text-foreground",   // Pink
        "cat-9": "border-transparent bg-chart-9/25 text-foreground",   // Brown
        "cat-10": "border-transparent bg-chart-10/25 text-foreground", // Gray
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
