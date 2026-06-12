import { Suspense } from "react"

import { LandingView } from "./_components/landing-view"

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingView />
    </Suspense>
  )
}
