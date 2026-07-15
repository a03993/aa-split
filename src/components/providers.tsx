"use client"

import { useState } from "react"

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { Toaster } from "sonner"

import { GlobalMutationOverlay } from "@/components/global-mutation-overlay"
import { LiffProvider } from "@/components/liff-provider"

interface ProvidersProps {
  children: React.ReactNode
}

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? ""

// cache 結構有不相容變動時（例如 query key 格式改變）記得手動升版，
// buster 不同時 persist 套件會自動丟棄舊快取，避免舊格式資料造成執行期錯誤。
const PERSIST_BUSTER = "v1"
const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: PERSIST_MAX_AGE,
      },
    },
  })
}

// SSR 階段沒有 window/localStorage，此時回傳 undefined。
function createPersister() {
  if (typeof window === "undefined") {
    return undefined
  }

  return createAsyncStoragePersister({
    storage: {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key, value) => Promise.resolve(window.localStorage.setItem(key, value)),
      removeItem: (key) => Promise.resolve(window.localStorage.removeItem(key)),
    },
    key: "aa-split-query-cache",
  })
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient)
  const [persister] = useState(createPersister)

  const inner = (
    <>
      <LiffProvider liffId={LIFF_ID}>{children}</LiffProvider>
      <GlobalMutationOverlay />
      <Toaster position="top-center" />
    </>
  )

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{inner}</QueryClientProvider>
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE, buster: PERSIST_BUSTER }}
    >
      {inner}
    </PersistQueryClientProvider>
  )
}
