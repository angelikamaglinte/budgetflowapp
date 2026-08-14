import { cn } from '@/lib/utils'
import type { FileCategory } from '@/types'
import { FILE_CATEGORY_COLORS, FILE_CATEGORY_LABELS } from '@/types'

export function FileTypeBadge({ category }: { category: string }) {
  const key = category as FileCategory
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        FILE_CATEGORY_COLORS[key] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {FILE_CATEGORY_LABELS[key] ?? category}
    </span>
  )
}
