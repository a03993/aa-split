// LIFF Service 工廠 — 依 NEXT_PUBLIC_ENV 選擇對應實作
// 請一律從此檔匯入，禁止直接匯入 LiveLiffService 或 LocalLiffService
import { LiveLiffService } from "./liff.live"
import { LocalLiffService } from "./liff.local"
import type { LiffService } from "./liff.provider"

// 單例 — 所有呼叫端共享同一個已初始化的實例
let liveLiffServiceInstance: LiveLiffService | null = null

export function createLiffService(): LiffService {
  if (process.env.NEXT_PUBLIC_ENV === "local") {
    return new LocalLiffService()
  }

  if (!liveLiffServiceInstance) {
    liveLiffServiceInstance = new LiveLiffService()
  }
  return liveLiffServiceInstance
}
