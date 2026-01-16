import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-background transition-all gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground bg-primary border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:bg-primary/90",
        noShadow: "text-primary-foreground bg-primary border-2 border-border hover:bg-primary/90",
        neutral:
          "bg-secondary-background text-foreground border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        reverse:
          "text-primary-foreground bg-primary border-2 border-border hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY hover:shadow-shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        // Clean variants for dashboard/admin pages
        ghost: "hover:bg-accent/20",
        outline: "border border-border/50 bg-surface-2 hover:bg-accent/15 hover:border-accent/40",
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
