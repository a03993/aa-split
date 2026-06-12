// LINE 驗證 — 客戶端輔助模組
// 此檔案不是 Supabase Edge Function，而是呼叫 Next.js API route /api/auth/line 的客戶端工具。
// 實際的 LINE token 交換與 Supabase session 建立均在 API route 伺服器端完成，
// OTP 等敏感資料不會在此模組中出現。

export interface LineAuthPayload {
  accessToken: string
}

export interface LineAuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    displayName: string
    avatarUrl?: string
    lineUserId: string
  }
}

/**
 * 將 LIFF access token 送至伺服器端 API route 進行身份驗證，
 * 換取 Supabase session 的 accessToken 與 refreshToken。
 *
 * @throws {Error} 請求失敗或伺服器回傳非 2xx 狀態時拋出。
 */
export async function exchangeLineToken(payload: LineAuthPayload): Promise<LineAuthResponse> {
  const response = await fetch("/api/auth/line", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `LINE auth failed with status ${response.status}`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) {
        message = body.error
      }
    } catch {
      // JSON 解析失敗時，fallback 使用 HTTP status code 作為錯誤訊息，靜默忽略解析錯誤。
    }
    throw new Error(message)
  }

  return (await response.json()) as LineAuthResponse
}
