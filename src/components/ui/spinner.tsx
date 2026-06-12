import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  label?: string
}

function Spinner({ className, label, ...props }: SpinnerProps) {
  if (label) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <Loader2Icon
          className={cn("size-8 animate-spin text-muted-foreground", className)}
          {...props}
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    )
  }
  return <Loader2Icon className={cn("size-8 animate-spin", className)} {...props} />
}

export { Spinner }
