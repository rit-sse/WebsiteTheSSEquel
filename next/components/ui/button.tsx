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
          "text-primary-foreground bg-primary hover:bg-primary/90",
          // Neo mode: hard shadow + translate
          "neo:border-2 neo:border-border neo:shadow-shadow neo:hover:translate-x-boxShadowX neo:hover:translate-y-boxShadowY neo:hover:shadow-none",
          // Clean mode: soft shadow + subtle hover
          "clean:border clean:border-border/30 clean:shadow-sm clean:hover:shadow-md clean:hover:scale-[1.02]",
        ].join(" "),
        noShadow: [
          "text-primary-foreground bg-primary hover:bg-primary/90",
          "neo:border-2 neo:border-border",
          "clean:border clean:border-border/30",
        ].join(" "),
        neutral: [
          "bg-secondary-background text-foreground",
          "neo:border-2 neo:border-border neo:shadow-shadow neo:hover:translate-x-boxShadowX neo:hover:translate-y-boxShadowY neo:hover:shadow-none",
          "clean:border clean:border-border/30 clean:shadow-sm clean:hover:shadow-md clean:hover:scale-[1.02]",
        ].join(" "),
        reverse: [
          "text-primary-foreground bg-primary hover:bg-primary/90",
          "neo:border-2 neo:border-border neo:hover:translate-x-reverseBoxShadowX neo:hover:translate-y-reverseBoxShadowY neo:hover:shadow-shadow",
          "clean:border clean:border-border/30 clean:shadow-sm clean:hover:shadow-md",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "neo:border-2 neo:border-border neo:shadow-shadow neo:hover:translate-x-boxShadowX neo:hover:translate-y-boxShadowY neo:hover:shadow-none",
          "clean:border clean:border-destructive/30 clean:shadow-sm clean:hover:shadow-md clean:hover:bg-destructive/90",
        ].join(" "),
        // These variants stay consistent across both modes
        ghost: "hover:bg-accent/20",
        outline: [
          "bg-surface-2 hover:bg-accent/15",
          "neo:border-2 neo:border-border/50 neo:hover:border-accent/40",
          "clean:border clean:border-border/30 clean:hover:border-accent/40",
        ].join(" "),
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        link: "hover:underline",
        destructiveGhost: "hover:bg-destructive/20",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
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
