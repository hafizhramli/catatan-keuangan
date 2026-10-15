import type { LucideIcon } from 'lucide-react'
import {
  BriefcaseBusiness,
  Bus,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
} from 'lucide-react'

export const categoryIcons: Record<string, LucideIcon> = {
  Pekerjaan: BriefcaseBusiness,
  Bisnis: BriefcaseBusiness,
  Makanan: Utensils,
  Belanja: ShoppingBag,
  Tagihan: Receipt,
  Transportasi: Bus,
}

export const fallbackCategoryIcon: LucideIcon = Tag

export function getCategoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? fallbackCategoryIcon
}
