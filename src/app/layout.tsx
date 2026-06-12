import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"

import { Header } from "@/components/header"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "AA Split",
  description: "多人分帳 App",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // viewportFit=cover：讓內容延伸至劉海/圓角等安全區域以外，
  // 搭配 env(safe-area-inset-*) 對需要避開的元素（Header、FAB、Sheet）手動加 padding。
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning lang="zh-TW" className={cn("font-sans", geist.variable)}>
      <body className="h-dvh">
        <Providers>
          <div className="flex h-full flex-col overflow-hidden">
            <Header />
            <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
