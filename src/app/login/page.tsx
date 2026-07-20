import { Suspense } from "react"

import { Spinner } from "@/components/ui/spinner"

import { LoginView } from "./_components/login-view"

const fallback = (
  <div className="flex flex-1 items-center justify-center">
    <Spinner />
  </div>
)

export default function LoginPage() {
  return (
    <Suspense fallback={fallback}>
      <LoginView />
    </Suspense>
  )
}
