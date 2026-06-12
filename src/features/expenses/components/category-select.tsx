"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCategoryLabel } from "@/lib/categories"
import type { Category } from "@/types/app.types"

const ALL_SELECT_VALUE = "__all__"

interface CategorySelectProps {
  categories: string[]
  value: string | null
  onValueChange: (value: string | null) => void
  customCategories?: Category[]
  placeholder?: string
  className?: string
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  customCategories,
  placeholder,
  className,
}: CategorySelectProps) {
  return (
    <Select
      value={value ?? ALL_SELECT_VALUE}
      onValueChange={(selectedValue) =>
        onValueChange(selectedValue === ALL_SELECT_VALUE ? null : selectedValue)
      }
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        style={{ width: "var(--radix-select-trigger-width)" }}
      >
        <SelectItem value={ALL_SELECT_VALUE}>全部</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {getCategoryLabel(category, customCategories)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
