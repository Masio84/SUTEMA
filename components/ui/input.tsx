import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-primary/20 bg-white/50 dark:bg-primary-900/30 px-4 py-2 text-base transition-all duration-300 outline-none selection:bg-primary/30 placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm backdrop-blur-sm focus-glow",
        "aria-invalid:border-destructive focus-visible:aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
