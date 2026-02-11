import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - always applied
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-base ring-offset-background transition-all gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 neo:rounded-base clean:rounded-md",
  {
    variants: {
      variant: {
        default: [
          "text-white bg-chart-2 hover:bg-chart-2/85",
          // Neo mode: bold border, no hard shadow/translate (reserved for CTA)
          "neo:border-2 neo:border-black/20",
          // Clean mode: soft shadow + subtle hover
          "clean:border clean:border-chart-2/30 clean:shadow-sm clean:hover:shadow-md clean:hover:scale-[1.02]",
        ].join(" "),
        noShadow: [
          "text-white bg-chart-2 hover:bg-chart-2/85",
          "neo:border-2 neo:border-black/20",
          "clean:border clean:border-chart-2/30",
        ].join(" "),
        neutral: [
          "bg-secondary-background text-foreground",
          // Neo mode: bold border, no hard shadow/translate
          "neo:border-2 neo:border-border/50",
          "clean:border clean:border-border/30 clean:shadow-sm clean:hover:shadow-md clean:hover:scale-[1.02]",
        ].join(" "),
        reverse: [
          "text-white bg-chart-7 hover:bg-chart-7/85",
          "neo:border-2 neo:border-black/20",
          "clean:border clean:border-chart-7/30 clean:shadow-sm clean:hover:shadow-md",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "neo:border-2 neo:border-border/50",
          "clean:border clean:border-destructive/30 clean:shadow-sm clean:hover:shadow-md clean:hover:bg-destructive/90",
        ].join(" "),
        // These variants stay consistent across both modes
        ghost: "hover:bg-accent/20",
        outline: [
          "bg-surface-2 hover:bg-surface-3 text-foreground",
          "neo:border-2 neo:border-foreground/20 neo:hover:border-foreground/35",
          "clean:border clean:border-foreground/15 clean:hover:border-foreground/30",
        ].join(" "),
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        link: "hover:underline",
        destructiveGhost: "hover:bg-destructive/20",
        accent: "bg-chart-5 text-white hover:bg-chart-5/85",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
        xs: "h-7 px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
