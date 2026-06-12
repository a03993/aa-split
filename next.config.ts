import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // typedRoutes 在 Next.js 15 已為穩定功能，不再需要 experimental 包裝
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
        // LINE 頭像路徑格式為 /0h*，限制 pathname 最小化攻擊面
        pathname: "/0h/**",
      },
    ],
  },
}

export default nextConfig
