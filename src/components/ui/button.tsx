import * as React from "react"

import { type VariantProps, cva } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex gap-2 px-2 shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-normal whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:opacity-80 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border bg-background [&_svg]:text-border",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "bg-transparent text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        link: "underline-offset-4 underline text-primary",
      },
      size: {
        default: "h-11 [&_svg]:size-5",
        sm: "h-8 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-4",
        "icon-md": "size-11 [&_svg]:size-5",
        "icon-lg": "size-16 rounded-full [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
