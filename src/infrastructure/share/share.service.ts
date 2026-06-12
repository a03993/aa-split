import type { LiffService } from "@/infrastructure/liff/liff.provider"

export interface ShareService {
  /**
   * 回傳帳本邀請／詳情頁的正式公開網址。
   */
  getBookUrl(bookId: string): string

  /**
   * 透過 LIFF shareTargetPicker 將帳本邀請連結分享至 LINE 聊天室。
   * 非 LINE 客戶端環境時，改為在瀏覽器開啟 LINE 分享網址。
   */
  shareToLine(bookId: string, bookName: string): Promise<void>
}

export class WebShareService implements ShareService {
  constructor(private readonly liffService: LiffService) {}

  getBookUrl(bookId: string): string {
    // 優先順序：NEXT_PUBLIC_APP_URL（正式環境）> NEXT_PUBLIC_VERCEL_URL（Vercel Preview）> ''（本地）
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (vercelUrl ? `https://${vercelUrl}` : "")
    return `${baseUrl}/group/${bookId}`
  }

  async shareToLine(bookId: string, bookName: string): Promise<void> {
    const bookUrl = this.getBookUrl(bookId)

    if (this.liffService.isInClient()) {
      await this.liffService.shareMessage([
        {
          type: "text",
          text: `Join our split: ${bookName}\n${bookUrl}`,
        },
      ])
    } else {
      const text = `Join our split: ${bookName}\n${bookUrl}`
      const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(bookUrl)}&text=${encodeURIComponent(text)}`
      window.open(lineShareUrl, "_blank", "noopener,noreferrer")
    }
  }
}
