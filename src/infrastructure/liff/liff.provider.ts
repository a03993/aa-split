// LIFF Service 抽象層
// 此檔定義所有 LIFF 實作必須遵守的介面。
// 正式實作使用 @line/liff；本地開發使用 mock 實作。

export interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

export interface LiffService {
  /** 必須在呼叫其他方法前先執行。 */
  initialize(liffId: string): Promise<void>

  isLoggedIn(): boolean

  login(): void

  logout(): void

  /** 回傳目前使用者的 LINE profile。未初始化或未登入時拋出例外。 */
  getProfile(): Promise<LiffProfile>

  /** 回傳 LIFF access token；未登入或 token 不可用時回傳 null。 */
  getAccessToken(): string | null

  isInClient(): boolean

  /** 開啟 LINE 分享目標選擇器。僅在 isInClient() 為 true 時可呼叫。 */
  shareMessage(messages: unknown[]): Promise<void>
}
