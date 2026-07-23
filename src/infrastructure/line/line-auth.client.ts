// 把 LIFF ID Token 送到後端，換回 Supabase session（accessToken/refreshToken/user），失敗就 throw

export interface LineAuthPayload {
  idToken: string
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

export async function exchangeLineToken(payload: LineAuthPayload): Promise<LineAuthResponse> {
  const res = await fetch("/api/auth/line", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let message = `LINE auth failed with status ${res.status}`

    try {
      const body = (await res.json()) as { error?: string }

      if (body.error) {
        message = body.error
      }
    } catch {
      // 解析失敗就用狀態碼當錯誤訊息，不用管解析錯誤本身
    }
    throw new Error(message)
  }

  return (await res.json()) as LineAuthResponse
}
