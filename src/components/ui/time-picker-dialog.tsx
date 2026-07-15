"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ClockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const ITEM_HEIGHT = 48
const VISIBLE_ITEMS = 5
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS
const REPEATS = 3
const MID_REPEAT = 1

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

// 預先計算重複陣列與總長，HOURS/MINUTES 是 module-level 常數，不會改變
const REPEATED_HOURS = Array.from({ length: REPEATS }, () => HOURS).flat()
const REPEATED_MINUTES = Array.from({ length: REPEATS }, () => MINUTES).flat()

interface TimePickerDialogProps {
  id?: string
  hour: string
  minute: string
  onConfirm: (hour: string, minute: string) => void
}

function getInitialScrollTop(val: string, items: string[]): number {
  const idx = items.indexOf(val)
  return (MID_REPEAT * items.length + (idx === -1 ? 0 : idx)) * ITEM_HEIGHT
}

function ScrollColumn({
  items,
  repeatedItems,
  value,
  onChange,
}: {
  items: string[]
  repeatedItems: string[]
  value: string
  onChange: (val: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isSnapping = useRef(false)
  const touchEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [centeredIdx, setCenteredIdx] = useState(
    () => MID_REPEAT * items.length + Math.max(0, items.indexOf(value)),
  )

  // 定位到中間段對應 value 的位置，同步更新 centeredIdx 避免高亮錯位
  useEffect(() => {
    const scrollTop = getInitialScrollTop(value, items)
    const newCenteredIdx = Math.round(scrollTop / ITEM_HEIGHT)

    const raf = requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.scrollTop = scrollTop
      }
    })

    setCenteredIdx(newCenteredIdx)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items])

  const normalizeToMiddle = useCallback(() => {
    const el = ref.current

    if (!el) {
      return
    }

    const singleLen = items.length * ITEM_HEIGHT
    const midStart = MID_REPEAT * singleLen
    const midEnd = (MID_REPEAT + 1) * singleLen

    if (el.scrollTop < midStart || el.scrollTop >= midEnd) {
      const rawIdx = Math.round(el.scrollTop / ITEM_HEIGHT)
      const realIdx = ((rawIdx % items.length) + items.length) % items.length

      el.scrollTop = (MID_REPEAT * items.length + realIdx) * ITEM_HEIGHT
    }
  }, [items])

  // 滾動到指定的 repeatedIdx，完成後 normalize 回中間段
  const scrollToRepeatedIdx = useCallback(
    (repeatedIdx: number) => {
      const el = ref.current

      if (!el || isSnapping.current) {
        return
      }

      isSnapping.current = true

      const targetTop = repeatedIdx * ITEM_HEIGHT
      el.scrollTo({ top: targetTop, behavior: "smooth" })

      const realIdx = ((repeatedIdx % items.length) + items.length) % items.length
      onChange(items[realIdx])

      if (snapTimer.current) {
        clearTimeout(snapTimer.current)
      }

      snapTimer.current = setTimeout(() => {
        isSnapping.current = false
        normalizeToMiddle()
      }, 350)
    },
    [items, onChange, normalizeToMiddle],
  )

  const snapToNearest = useCallback(() => {
    const el = ref.current

    if (!el || isSnapping.current) {
      return
    }

    const rawIdx = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(rawIdx, repeatedItems.length - 1))

    scrollToRepeatedIdx(clamped)
  }, [repeatedItems.length, scrollToRepeatedIdx])

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    el.addEventListener("scrollend", snapToNearest)

    function handleTouchEnd() {
      if (touchEndTimer.current) {
        clearTimeout(touchEndTimer.current)
      }

      touchEndTimer.current = setTimeout(snapToNearest, 350)
    }
    el.addEventListener("touchend", handleTouchEnd)

    return () => {
      el.removeEventListener("scrollend", snapToNearest)
      el.removeEventListener("touchend", handleTouchEnd)

      if (touchEndTimer.current) {
        clearTimeout(touchEndTimer.current)
      }

      if (snapTimer.current) {
        clearTimeout(snapTimer.current)
      }
    }
  }, [snapToNearest])

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    function handleScroll() {
      if (!el) {
        return
      }

      const next = Math.round(el.scrollTop / ITEM_HEIGHT)

      // 只在整格邊界變化時才觸發 re-render
      setCenteredIdx((prev) => (prev === next ? prev : next))
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative flex-1">
      <div
        className="pointer-events-none absolute inset-x-0 z-0 rounded-lg bg-muted"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-background to-transparent"
        style={{ height: ITEM_HEIGHT * 2 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background to-transparent"
        style={{ height: ITEM_HEIGHT * 2 }}
      />
      <div
        ref={ref}
        className="relative z-10 overflow-y-scroll"
        style={{
          height: CONTAINER_HEIGHT,
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          overscrollBehavior: "contain",
        }}
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {repeatedItems.map((item, i) => (
          <TimeItem
            key={i}
            item={item}
            dist={Math.abs(i - centeredIdx)}
            onSelect={() => scrollToRepeatedIdx(i)}
          />
        ))}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  )
}

function TimeItem({ item, dist, onSelect }: { item: string; dist: number; onSelect: () => void }) {
  return (
    <div
      style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
      className={cn(
        "flex cursor-pointer items-center justify-center tabular-nums transition-all duration-150",
        dist === 0
          ? "text-2xl font-semibold text-foreground"
          : dist === 1
            ? "text-xl font-normal text-foreground/60"
            : "text-lg font-normal text-foreground/30",
      )}
      onClick={onSelect}
    >
      {item}
    </div>
  )
}

export function TimePickerDialog({ id, hour, minute, onConfirm }: TimePickerDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState(hour)
  const [selectedMinute, setSelectedMinute] = useState(minute)

  useEffect(() => {
    if (open) {
      setSelectedHour(hour)
      setSelectedMinute(minute)
    }
  }, [open, hour, minute])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id={id} variant="outline" className="justify-start text-base">
          <ClockIcon className="text-muted-foreground" />
          {hour}:{minute}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="sr-only">選擇時間</DialogTitle>
        <div className="flex items-center gap-2">
          <ScrollColumn
            items={HOURS}
            repeatedItems={REPEATED_HOURS}
            value={selectedHour}
            onChange={setSelectedHour}
          />
          <span className="text-2xl font-medium text-muted-foreground">:</span>
          <ScrollColumn
            items={MINUTES}
            repeatedItems={REPEATED_MINUTES}
            value={selectedMinute}
            onChange={setSelectedMinute}
          />
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="ghost"
            className="flex-1 text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onConfirm(selectedHour, selectedMinute)
              setOpen(false)
            }}
          >
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
