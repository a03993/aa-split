import { Suspense } from "react"

import { Home } from "@/app/_components/home"
import { Spinner } from "@/components/ui/spinner"

const fallback = (
  <div className="flex flex-1 items-center justify-center">
    <Spinner />
  </div>
)

export default function Page() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/50">
      <Suspense fallback={fallback}>
        <Home />
      </Suspense>
    </div>
  )
}
