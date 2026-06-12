"use client"

import * as React from "react"

import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  onInteractOutside = (e) => e.preventDefault(),
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/40 duration-100"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-4 rounded-t-2xl border-t bg-popover bg-clip-padding p-6 text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))]",
          className,
        )}
        onInteractOutside={onInteractOutside}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close asChild data-slot="sheet-close">
            <Button variant="ghost" className="absolute right-2 top-2">
              <XIcon />
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-row gap-2", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle }
