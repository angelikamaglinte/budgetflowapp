import { motion } from 'motion/react'
import { Pencil, Trash2, RefreshCw } from 'lucide-react'
import { CategoryBadge } from '@/components/expenses/CategoryBadge'
import { cn } from '@/lib/utils'
import type { RecurringExpense } from '@/types'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface RecurringExpenseCardProps {
  item: RecurringExpense
  delay?: number
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export function RecurringExpenseCard({ item, delay = 0, onEdit, onDelete, onToggleActive }: RecurringExpenseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className={cn(
        'bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow',
        !item.active && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(item.amount)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <CategoryBadge category={item.category} />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E9F3F7] text-[#487CA5]">
          <RefreshCw className="w-3 h-3" /> {ordinal(item.day_of_month)} of every month
        </span>
      </div>
      <button
        onClick={onToggleActive}
        className={cn(
          'text-xs font-medium hover:underline',
          item.active ? 'text-gray-400' : 'text-primary-600'
        )}
      >
        {item.active ? 'Pause' : 'Resume'}
      </button>
    </motion.div>
  )
}
