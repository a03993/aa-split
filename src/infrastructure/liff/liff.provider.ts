// LiveLiffService、LocalLiffService 都要實作這個介面
export interface LiffService {
  /** 要先呼叫這個，才能用其他方法 */
  initialize(liffId: string): Promise<void>

  isLoggedIn(): boolean

  /** redirectUri 要跟這個 LIFF app 網址同網域，登入完成後導去這裡 */
  login(options?: { redirectUri?: string }): void

  logout(): void

  /**
   * 回傳 LINE 簽過名的 ID Token，沒登入或拿不到就回傳 null
   * 後端會用這個驗證身份，channel 要有開 openid scope 才拿得到
   */
  getIDToken(): string | null

  isInClient(): boolean

  /** 開啟 LINE 的分享選單，只能在 isInClient() 是 true 時用 */
  shareMessage(messages: unknown[]): Promise<void>
}
