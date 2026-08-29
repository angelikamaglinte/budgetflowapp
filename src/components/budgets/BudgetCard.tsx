import { motion } from 'motion/react'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeBudgetProgress } from '@/lib/budgets'
import { formatMoney } from '@/lib/savingsCalculator'
import type { BudgetCategory } from '@/types'

interface BudgetCardProps {
  budget: BudgetCategory
  actual: number
  delay?: number
  onEdit: () => void
  onDelete: () => void
}

const STATUS_STYLES = {
  ok: { bar: 'bg-[#548164]', pill: 'bg-[#EEF3ED] text-[#548164]' },
  warning: { bar: 'bg-[#C29343]', pill: 'bg-[#FAF3DD] text-[#C29343]' },
  over: { bar: 'bg-[#C4554D]', pill: 'bg-[#FAECEC] text-[#C4554D]' },
} as const

export function BudgetCard({ budget, actual, delay = 0, onEdit, onDelete }: BudgetCardProps) {
  const orphaned = budget.source_type === 'bucket' && !budget.bucket_id
  const progress = computeBudgetProgress(budget.monthly_target, actual)
  const style = STATUS_STYLES[progress.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{budget.name}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(actual)}</p>
          <p className="text-xs text-gray-400">of {formatMoney(budget.monthly_target)} budgeted</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {orphaned && (
        <div className="flex items-start gap-2 bg-[#FAF3DD] text-[#C29343] text-xs px-3 py-2.5 rounded-xl mb-3">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>The payout bucket this budget tracked was deleted. Delete this budget and add a new one.</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium',
            style.pill
          )}
        >
          {progress.status === 'over'
            ? `Over by ${formatMoney(-progress.remaining)}`
            : `${formatMoney(progress.remaining)} left`}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress.percentUsed)}%` }}
            transition={{ duration: 0.6, delay: delay + 0.1 }}
            className={cn('h-full rounded-full', style.bar)}
          />
        </div>
      </div>
    </motion.div>
  )
}
