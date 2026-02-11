import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full bg-secondary-background selection:bg-primary selection:text-primary-foreground px-3 py-2 text-sm font-base text-foreground file:border-0 file:bg-transparent file:text-sm file:font-heading placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-interactive-disabled/25 disabled:text-text-subtle",
        // Neo mode: thick border
        "neo:rounded-base neo:border-2 neo:border-border",
        // Clean mode: thin border, softer corners
        "clean:rounded-md clean:border clean:border-border/50",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
