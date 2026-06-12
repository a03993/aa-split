import { useRef, useState } from "react"

interface UsePendingNameListOptions {
  /** 已存在的名稱（用於驗重名），每次渲染傳入最新值即可 */
  existingNames: string[]
}

/**
 * 管理「輸入 → 驗重名 → badge 清單」的共用邏輯。
 * 供 MemberDialog（新增成員）和 CreateBookSheet（建立帳本時加成員）共用。
 *
 * 錯誤訊息由 hook 內部管理（`error` state），
 * 呼叫端可選擇直接顯示 `error`，或另行整合到 react-hook-form 的 setError。
 */
export function usePendingNameList({ existingNames }: UsePendingNameListOptions) {
  const [input, setInput] = useState("")
  const [names, setNames] = useState<string[]>([])
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    const name = input.trim()
    if (!name) return
    if (existingNames.includes(name) || names.includes(name)) {
      setError("已有同名成員")
      return
    }
    setNames((prev) => [...prev, name])
    setInput("")
    setError("")
    inputRef.current?.focus()
  }

  function handleRemove(name: string) {
    setNames((prev) => prev.filter((n) => n !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  function resetList() {
    setInput("")
    setNames([])
    setError("")
  }

  return {
    input,
    setInput,
    names,
    error,
    setError,
    handleAdd,
    handleRemove,
    handleKeyDown,
    resetList,
    inputRef,
  }
}
