/**
 * 將 amount 盡可能均分給 memberCount 位成員。
 * 使用整數算術避免浮點誤差，確保加總嚴格等於 amount。
 * 餘數補給第一位成員。
 * 範例：100 / 3 → [33.34, 33.33, 33.33]
 */
export function calculateEqualSplit(amount: number, memberCount: number): number[] {
  if (memberCount <= 0) {
    throw new RangeError("memberCount must be at least 1")
  }

  if (amount < 0) {
    throw new RangeError("amount must be non-negative")
  }

  const totalCents = Math.round(amount * 100)
  const baseCents = Math.floor(totalCents / memberCount)
  const remainderCents = totalCents - baseCents * memberCount

  const splits: number[] = []

  for (let i = 0; i < memberCount; i++) {
    const extraCents = i < remainderCents ? 1 : 0
    splits.push((baseCents + extraCents) / 100)
  }

  return splits
}

/**
 * 計算自訂分攤：部分人手動指定金額，其餘人依份數比例分配剩餘金額。
 * 使用整數算術確保加總嚴格等於 amount。
 * 餘數補給最後一位份數模式的參與者。
 *
 * @param amount 總金額
 * @param participants 每位參與者的設定
 *   - memberId: 成員 ID
 *   - fixedAmount: 手動指定金額（undefined 表示使用份數模式）
 *   - shares: 份數（預設 1，fixedAmount 存在時忽略）
 */
export function calculateCustomSplit(
  amount: number,
  participants: Array<{ memberId: string; shares?: number; fixedAmount?: number }>,
): Array<{ memberId: string; amount: number; shares: number | null }> {
  const manualTotalCents = participants.reduce(
    (acc, p) => acc + (p.fixedAmount !== undefined ? Math.round(p.fixedAmount * 100) : 0),
    0,
  )
  const remainingCents = Math.round(amount * 100) - manualTotalCents

  const sharers = participants.filter((p) => p.fixedAmount === undefined)
  const totalShares = sharers.reduce((acc, p) => acc + (p.shares ?? 1), 0)

  // 依份數比例分配 remainingCents，餘數補給最後一人
  const { shareCents } = sharers.reduce(
    (acc, p, i) => {
      const isLast = i === sharers.length - 1
      const cents = isLast
        ? remainingCents - acc.distributed
        : Math.floor((remainingCents * (p.shares ?? 1)) / totalShares)
      acc.shareCents[p.memberId] = cents
      acc.distributed += cents
      return acc
    },
    { shareCents: {} as Record<string, number>, distributed: 0 },
  )

  return participants.map((p) => ({
    memberId: p.memberId,
    amount: p.fixedAmount !== undefined ? p.fixedAmount : shareCents[p.memberId] / 100,
    shares: p.fixedAmount !== undefined ? null : (p.shares ?? 1),
  }))
}

/**
 * 驗證分攤金額加總是否等於 amount（容差 ±0.01）。
 * 適用於 equal 及 custom 兩種分攤模式的結果驗證。
 */
export function validateSplits(amount: number, splits: number[]): boolean {
  if (splits.length === 0) {
    return false
  }

  const total = splits.reduce((acc, val) => acc + val, 0)

  return Math.abs(total - amount) <= 0.01
}
