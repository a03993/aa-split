import type { ElementType } from "react"

import {
  BedDouble,
  Briefcase,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gift,
  Mountain,
  Music,
  Plane,
  Receipt,
  ShoppingBasket,
  Snowflake,
  Stethoscope,
  Ticket,
  UtensilsCrossed,
  Waves,
  Wine,
} from "lucide-react"

import type { Category } from "@/types/app.types"

export const DEFAULT_CATEGORIES: Category[] = [
  { key: "food", label: "餐飲", icon: "UtensilsCrossed" },
  { key: "transport", label: "交通", icon: "Car" },
  { key: "accommodation", label: "住宿", icon: "BedDouble" },
  { key: "shopping", label: "購物", icon: "ShoppingBasket" },
]

const ICON_MAP: Record<string, ElementType> = {
  UtensilsCrossed,
  BedDouble,
  Car,
  ShoppingBasket,
  Ticket,
  Stethoscope,
  Plane,
  Coffee,
  Music,
  Gamepad2,
  Gift,
  Camera,
  Dumbbell,
  Briefcase,
  Mountain,
  Waves,
  Snowflake,
  Wine,
}

export const CUSTOM_CATEGORY_ICONS: {
  icon: string
  label: string
  keywords: string[]
}[] = [
  {
    icon: "Coffee",
    label: "咖啡",
    keywords: ["咖啡", "飲料", "手搖", "茶", "奶茶", "珍奶", "拿鐵", "星巴克", "咖啡廳"],
  },
  {
    icon: "Wine",
    label: "酒水",
    keywords: ["酒", "喝酒", "啤酒", "紅酒", "白酒", "清酒", "調酒", "酒吧", "bar", "居酒屋"],
  },
  {
    icon: "Ticket",
    label: "票券",
    keywords: ["票", "門票", "電影", "展覽", "演唱會", "表演", "景點", "遊樂園", "博物館"],
  },
  {
    icon: "Music",
    label: "音樂",
    keywords: ["音樂", "ktv", "卡拉ok", "演唱", "live", "聽歌", "音樂節"],
  },
  {
    icon: "Gamepad2",
    label: "遊戲",
    keywords: ["遊戲", "電玩", "game", "手遊", "網咖", "點數", "steam"],
  },
  {
    icon: "Dumbbell",
    label: "運動",
    keywords: ["運動", "健身", "跑步", "瑜伽", "球", "羽球", "籃球", "足球", "網球", "衝浪"],
  },
  {
    icon: "Mountain",
    label: "登山",
    keywords: ["登山", "爬山", "健行", "步道", "山", "攻頂", "百岳"],
  },
  {
    icon: "Waves",
    label: "水上活動",
    keywords: ["游泳", "潛水", "浮潛", "水上", "海泳", "自由潛", "水肺"],
  },
  {
    icon: "Snowflake",
    label: "雪上活動",
    keywords: ["滑雪", "滑板", "雪地", "滑雪場", "雪山", "單板", "雙板"],
  },
  {
    icon: "Plane",
    label: "機票",
    keywords: ["機票", "飛機", "航班", "航空", "機場", "飛行", "出發", "抵達"],
  },
  {
    icon: "Stethoscope",
    label: "醫療",
    keywords: ["醫", "藥", "診所", "醫院", "看診", "掛號", "藥局", "健康", "牙醫"],
  },
  {
    icon: "Gift",
    label: "禮物",
    keywords: ["禮物", "送禮", "禮", "紀念品", "伴手禮", "名產", "生日", "慶生"],
  },
]

export function getCategoryLabel(
  key: string,
  customCategories?: Array<{ key: string; label: string }>,
): string {
  const custom = customCategories?.find((c) => c.key === key)

  if (custom) {
    return custom.label
  }

  const category = DEFAULT_CATEGORIES.find((c) => c.key === key)

  return category?.label ?? key
}

export function getCategoryIcon(iconOrKey: string): ElementType {
  const category = DEFAULT_CATEGORIES.find((c) => c.key === iconOrKey)
  const iconName = category?.icon ?? iconOrKey
  return ICON_MAP[iconName] ?? Receipt
}
