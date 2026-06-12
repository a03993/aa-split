"use client"

import { useState } from "react"

import { CheckIcon, ChevronDownIcon, PlusIcon, TagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CUSTOM_CATEGORY_ICONS, DEFAULT_CATEGORIES, getCategoryIcon } from "@/lib/categories"
import { cn } from "@/lib/utils"
import type { Category } from "@/types/app.types"

interface CategoryPickerDialogProps {
  id?: string
  value: string
  customCategories: Category[]
  onConfirm: (value: string, newCategory?: Category) => void
  hasError?: boolean
}

function getSuggestedIcon(label: string): string | undefined {
  if (!label.trim()) return undefined
  const lower = label.toLowerCase()
  const matched = CUSTOM_CATEGORY_ICONS.find((c) =>
    c.keywords.some((k) => lower.includes(k) || k.includes(lower)),
  )
  return matched?.icon ?? CUSTOM_CATEGORY_ICONS[0].icon
}

export function CategoryPickerDialog({
  id,
  value,
  customCategories,
  onConfirm,
  hasError,
}: CategoryPickerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState(value)
  const [newCategoryLabel, setNewCategoryLabel] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState(CUSTOM_CATEGORY_ICONS[0].icon)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)

  const DraftCategoryIcon = newCategoryLabel.trim() ? getCategoryIcon(newCategoryIcon) : PlusIcon
  const suggestedIcon = getSuggestedIcon(newCategoryLabel)

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]

  const selectedCategory = value ? allCategories.find((c) => c.key === value) : undefined
  const SelectedCategoryIcon = selectedCategory ? getCategoryIcon(selectedCategory.icon) : undefined

  function handleOpen(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedKey(value || DEFAULT_CATEGORIES[0].key)
      setNewCategoryLabel("")
      setNewCategoryIcon(CUSTOM_CATEGORY_ICONS[0].icon)
      setIsIconPickerOpen(false)
    }
    setIsOpen(nextOpen)
  }

  function handleLabelChange(label: string) {
    setNewCategoryLabel(label)

    if (label.trim()) {
      const suggested = getSuggestedIcon(label) ?? CUSTOM_CATEGORY_ICONS[0].icon
      setNewCategoryIcon(suggested)
      setSelectedKey(`pending_${suggested}`)
    } else {
      setNewCategoryIcon(CUSTOM_CATEGORY_ICONS[0].icon)
      setSelectedKey("")
    }
  }

  function handleIconChange(newIcon: string) {
    setNewCategoryIcon(newIcon)
    if (newCategoryLabel.trim()) setSelectedKey(`pending_${newIcon}`)
    setIsIconPickerOpen(false)
  }

  function handleListSelect(key: string) {
    setSelectedKey(key)
    setNewCategoryLabel("")
    setNewCategoryIcon(CUSTOM_CATEGORY_ICONS[0].icon)
    setIsIconPickerOpen(false)
  }

  function handleConfirm() {
    if (!selectedKey) return

    const newCategory: Category | undefined = newCategoryLabel.trim()
      ? { key: selectedKey, label: newCategoryLabel.trim(), icon: newCategoryIcon }
      : undefined

    onConfirm(selectedKey, newCategory)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn("justify-start text-base", hasError && "border-destructive")}
        >
          {SelectedCategoryIcon ? (
            <SelectedCategoryIcon />
          ) : (
            <TagIcon className="text-muted-foreground" />
          )}
          <span className={value ? "text-foreground" : "text-muted-foreground/50"}>
            {selectedCategory?.label || "分類"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle>選擇分類</DialogTitle>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {allCategories.map((cat) => {
            const isSelected = selectedKey === cat.key
            const Icon = getCategoryIcon(cat.icon)

            return (
              <Button
                key={cat.key}
                variant="ghost"
                className={cn("justify-between", isSelected && "font-medium")}
                onClick={() => handleListSelect(cat.key)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full p-2",
                      isSelected ? "bg-primary [&_svg]:stroke-white" : "bg-muted",
                    )}
                  >
                    <Icon />
                  </span>
                  {cat.label}
                </div>
                <CheckIcon
                  className={cn("size-4 text-primary", isSelected ? "visible" : "invisible")}
                />
              </Button>
            )
          })}

          <div className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <button
                  disabled={!newCategoryLabel.trim()}
                  className={cn(
                    "flex items-center justify-center rounded-full p-2",
                    newCategoryLabel.trim() ? "bg-primary [&_svg]:stroke-white" : "bg-muted",
                  )}
                  onClick={() => setIsIconPickerOpen((prev) => !prev)}
                >
                  <DraftCategoryIcon className="size-5" />
                </button>
                {newCategoryLabel.trim() && (
                  <ChevronDownIcon
                    className={cn(
                      "pointer-events-none absolute -bottom-1 -right-1 size-3 text-muted-foreground transition-transform",
                      isIconPickerOpen && "rotate-180",
                    )}
                  />
                )}
              </div>
              <div className="relative flex-1">
                <Input
                  placeholder="自訂分類名稱"
                  value={newCategoryLabel}
                  className={cn("w-full text-base", newCategoryLabel.trim() && "border-primary")}
                  onChange={(e) => handleLabelChange(e.target.value)}
                />
                {newCategoryLabel.trim() && (
                  <CheckIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                )}
              </div>
            </div>

            {isIconPickerOpen && (
              <div className="flex flex-wrap gap-2 pt-1">
                {CUSTOM_CATEGORY_ICONS.map((iconOption) => {
                  const isSelected = newCategoryIcon === iconOption.icon
                  const isRecommended =
                    !!newCategoryLabel.trim() && iconOption.icon === suggestedIcon
                  const Icon = getCategoryIcon(iconOption.icon)
                  return (
                    <button
                      key={iconOption.icon}
                      className="relative"
                      onClick={() => handleIconChange(iconOption.icon)}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full",
                          isSelected ? "bg-primary [&_svg]:stroke-white" : "bg-muted",
                        )}
                      >
                        <Icon size={18} />
                      </span>
                      {isRecommended && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[9px] leading-4 text-primary-foreground">
                          推薦
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-2">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              儲存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
