import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "focus-visible:ring-3 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 w-full rounded-lg border border-input bg-transparent p-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&.border-destructive]:focus-visible:border-destructive [&.border-destructive]:focus-visible:ring-destructive/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
