import type { LiffService } from "@/infrastructure/liff/liff.provider"

export interface ShareService {
  getBookUrl(bookId: string): string

  // 回傳 true 代表訊息確實送出，false 代表使用者取消分享
  shareToLine(bookId: string, bookName: string): Promise<boolean>
}

const SHARE_INVITE_LABEL = "邀你一起來 AA"

function buildShareText(bookName: string): string {
  return `${SHARE_INVITE_LABEL}：${bookName}`
}

// shareTargetPicker 的 Flex Message 只能用 bubble container，action 只能是 uri
function buildBookShareMessage(bookName: string, bookUrl: string) {
  return {
    type: "flex",
    altText: buildShareText(bookName),
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: SHARE_INVITE_LABEL, size: "sm", color: "#999999" },
          { type: "text", text: bookName, weight: "bold", size: "xl", wrap: true },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#06C755",
            action: { type: "uri", label: "加入帳本", uri: bookUrl },
          },
        ],
      },
    },
  }
}

export class WebShareService implements ShareService {
  constructor(private readonly liffService: LiffService) {}

  getBookUrl(bookId: string): string {
    // APP_URL > VERCEL_URL > 空字串（本機）
    let baseUrl = ""

    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL
    } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    }

    return `${baseUrl}/group/${bookId}`
  }

  async shareToLine(bookId: string, bookName: string): Promise<boolean> {
    const bookUrl = this.getBookUrl(bookId)
    const canUseShareTargetPicker =
      this.liffService.isInClient() && this.liffService.isApiAvailable("shareTargetPicker")

    if (canUseShareTargetPicker) {
      const message = buildBookShareMessage(bookName, bookUrl)
      return this.liffService.shareMessage([message])
    }

    const text = `${buildShareText(bookName)}\n${bookUrl}`
    const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(bookUrl)}&text=${encodeURIComponent(text)}`
    window.open(lineShareUrl, "_blank", "noopener,noreferrer")

    return true
  }
}
