// 通知服務 Stub 實作 — 推播通知功能待 LINE Official Account 設定完成後實作。

export interface NotificationService {
  /**
   * 通知帳本成員有新費用被新增。
   * @param bookId       費用所屬帳本 ID。
   * @param expenseTitle 費用標題。
   */
  notifyExpenseAdded(bookId: string, expenseTitle: string): Promise<void>

  /**
   * 通知帳本成員有費用被更新。
   * @param bookId       費用所屬帳本 ID。
   * @param expenseTitle 費用標題。
   */
  notifyExpenseUpdated(bookId: string, expenseTitle: string): Promise<void>

  /**
   * 通知帳本成員帳本已結算。
   * @param bookId 已結算的帳本 ID。
   */
  notifySettlement(bookId: string): Promise<void>
}

export class LineNotificationService implements NotificationService {
  async notifyExpenseAdded(bookId: string, expenseTitle: string): Promise<void> {
    // TODO: POST https://api.line.me/v2/bot/message/multicast
    //   - 查詢 bookId 對應的成員 line_user_ids
    //   - 標頭：Authorization: Bearer {CHANNEL_ACCESS_TOKEN}
    //   - 請求體：{ to: [lineUserId...], messages: [{ type: 'text', text }] }
    console.log(
      `[LineNotificationService] notifyExpenseAdded — bookId="${bookId}", expense="${expenseTitle}"`,
    )
  }

  async notifyExpenseUpdated(bookId: string, expenseTitle: string): Promise<void> {
    // TODO: 同 notifyExpenseAdded，訊息內容改為「費用已更新」
    console.log(
      `[LineNotificationService] notifyExpenseUpdated — bookId="${bookId}", expense="${expenseTitle}"`,
    )
  }

  async notifySettlement(bookId: string): Promise<void> {
    // TODO: 廣播結算摘要給帳本所有成員的 line_user_id
    console.log(`[LineNotificationService] notifySettlement — bookId="${bookId}"`)
  }
}
