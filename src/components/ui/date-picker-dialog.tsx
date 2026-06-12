"use client"

import { useEffect, useState } from "react"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface DatePickerDialogProps {
  id?: string
  date: Date
  onConfirm: (date: Date) => void
  hasError?: boolean
  className?: string
}

export function DatePickerDialog({
  id,
  date,
  onConfirm,
  hasError,
  className,
}: DatePickerDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(date)
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(date.getFullYear(), date.getMonth(), 1),
  )

  useEffect(() => {
    if (open) {
      setSelectedDate(date)
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }, [open, date])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id={id} variant="outline" className="justify-start text-base">
          <CalendarIcon />
          {format(date, "yyyy/MM/dd")}
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-x-hidden">
        <DialogTitle className="sr-only">選擇日期</DialogTitle>
        <Calendar
          fixedWeeks
          mode="single"
          selected={selectedDate}
          month={currentMonth}
          onSelect={(d) => {
            if (d) setSelectedDate(d)
          }}
          onMonthChange={setCurrentMonth}
        />
        <DialogFooter>
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
              onConfirm(selectedDate)
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
