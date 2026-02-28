import { cn } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/types'

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {category}
    </span>
  )
}
