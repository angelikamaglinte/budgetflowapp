import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Pencil, Trash2, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn, parseLocalDate } from '@/lib/utils'
import { computePurchaseProgress, formatMoney } from '@/lib/savingsCalculator'
import type { MonthlyAverages } from '@/lib/savingsCalculator'
import type { PurchasePlan } from '@/types'

interface PurchasePlanCardProps {
  plan: PurchasePlan
  averages: MonthlyAverages
  reservedRate: number
  delay?: number
  onEdit: () => void
  onDelete: () => void
}

export function PurchasePlanCard({ plan, averages, reservedRate, delay = 0, onEdit, onDelete }: PurchasePlanCardProps) {
  const progress = computePurchaseProgress(plan, averages, reservedRate)
  const { avgMonthlyLeftover, monthsUntilTarget, requiredMonthlyExtra, onTrack, shortfall, monthsAtCurrentRate, projectedDate } = progress

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
          <p className="font-medium text-gray-900 truncate">{plan.item_name}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(plan.price)}</p>
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

      {plan.target_date && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Target className="w-3.5 h-3.5" />
          Target: {format(parseLocalDate(plan.target_date), 'MMM d, yyyy')}
        </div>
      )}

      {avgMonthlyLeftover <= 0 ? (
        <div className="flex items-start gap-2 bg-[#FAECEC] text-[#C4554D] text-xs px-3 py-2.5 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Based on your last {averages.monthsOfDataUsed || 3} months, your expenses plus your {reservedRate}% in
            reserved buckets leave nothing extra to put toward this right now.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {plan.target_date && requiredMonthlyExtra !== null && (
            <>
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium',
                  onTrack ? 'bg-[#EEF3ED] text-[#548164]' : 'bg-[#FAF3DD] text-[#C29343]'
                )}
              >
                {onTrack
                  ? `On track — needs ${formatMoney(requiredMonthlyExtra)}/mo`
                  : `Short by ${formatMoney(shortfall!)}/mo`}
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (avgMonthlyLeftover / requiredMonthlyExtra) * 100)}%` }}
                  transition={{ duration: 0.6, delay: delay + 0.1 }}
                  className={cn('h-full rounded-full', onTrack ? 'bg-[#548164]' : 'bg-[#C29343]')}
                />
              </div>
              <p className="text-xs text-gray-400">
                {monthsUntilTarget} month{monthsUntilTarget === 1 ? '' : 's'} until your target date
              </p>
            </>
          )}

          {monthsAtCurrentRate !== null && projectedDate && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              At your current pace (~{formatMoney(avgMonthlyLeftover)}/mo leftover), you'd have this by{' '}
              {format(projectedDate, 'MMM yyyy')}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}
