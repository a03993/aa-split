// LIFF Service 工廠 — 依 NEXT_PUBLIC_ENV 選擇對應實作。
// 請一律從此檔匯入，禁止直接匯入 RealLiffService 或 MockLiffService。
import { MockLiffService } from "./liff.mock"
import type { LiffService } from "./liff.provider"
import { RealLiffService } from "./liff.real"

// 單例 — 所有呼叫端共享同一個已初始化的實例。
let realLiffServiceInstance: RealLiffService | null = null

export function createLiffService(): LiffService {
  if (process.env.NEXT_PUBLIC_ENV === "local") {
    return new MockLiffService()
  }

  if (!realLiffServiceInstance) {
    realLiffServiceInstance = new RealLiffService()
  }
  return realLiffServiceInstance
}
