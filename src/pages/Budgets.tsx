import { useMemo, useState } from 'react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Receipt, Wallet, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayoutBuckets } from '@/hooks/usePayoutBuckets'
import { computeMonthlySummary } from '@/lib/budgets'
import { getBucketStyle } from '@/lib/payoutBuckets'
import { formatMoney } from '@/lib/savingsCalculator'
import { cn, parseLocalDate } from '@/lib/utils'

export default function Budgets() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: buckets = [], isLoading: loadingBuckets } = usePayoutBuckets()

  const summary = useMemo(
    () => computeMonthlySummary(invoices, expenses, buckets, month),
    [invoices, expenses, buckets, month]
  )

  const isLoading = loadingExp || loadingInv || loadingBuckets

  return (
    <AppLayout
      title="Budgets"
      subtitle="See exactly how each payment splits, and what's left after this month's expenses"
      showPeriodSelector={false}
    >
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-700 w-32 text-center">{format(month, 'MMMM yyyy')}</span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Paid Invoices</h2>
            {summary.invoiceSplits.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-12 gap-2">
                <Receipt className="w-6 h-6 text-gray-300" />
                <p className="text-gray-500 text-sm">No invoices paid yet this month</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {summary.invoiceSplits.map(({ invoice, preTaxAmount, gstAmount, split }, i) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{invoice.client_name}</p>
                        <p className="text-xs text-gray-400">
                          {invoice.invoice_number} · paid {format(parseLocalDate(invoice.date_paid!), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900">{formatMoney(invoice.amount)}</p>
                        {gstAmount > 0 && (
                          <p className="text-xs text-gray-400">
                            {formatMoney(preTaxAmount)} split · {formatMoney(gstAmount)} GST held for CRA
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {split.map(({ bucket, amount }, j) => {
                        const style = getBucketStyle(j)
                        const Icon = style.icon
                        return (
                          <div key={bucket.id} className={cn('flex items-center gap-2.5 px-3 py-2 rounded-xl', style.iconBg)}>
                            <Icon className={cn('w-3.5 h-3.5 shrink-0', style.iconColor)} />
                            <p className="flex-1 min-w-0 text-sm text-gray-700 truncate">
                              {bucket.name}{bucket.percentage != null ? ` (${bucket.percentage}%)` : ''}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 shrink-0">{formatMoney(amount)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Summary</h2>
            {!summary.remainderBucket ? (
              <div className="rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex items-start gap-2 p-5 text-sm text-[#C29343] bg-[#FAF3DD]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Set up a remainder bucket (like "Owner Pay") in Settings → Payout Buckets to see your monthly leftover here.</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">Total {summary.remainderBucket.name} this month</p>
                  <p className="text-lg font-bold text-gray-900">{formatMoney(summary.remainderTotal)}</p>
                </div>

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expenses this month</p>
                {summary.monthExpenses.length === 0 ? (
                  <p className="text-sm text-gray-400 mb-4">No expenses logged yet</p>
                ) : (
                  <div className="flex flex-col gap-1.5 mb-4 max-h-72 overflow-y-auto">
                    {summary.monthExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">{expense.title}</p>
                          <p className="text-xs text-gray-400">{expense.category} · {expense.type}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 shrink-0">{formatMoney(expense.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">− {formatMoney(summary.monthExpensesTotal)} in expenses</p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Wallet className={cn('w-4 h-4', summary.leftover >= 0 ? 'text-[#548164]' : 'text-[#C4554D]')} />
                    <p className="text-sm font-medium text-gray-900">Left over</p>
                  </div>
                  <p className={cn('text-xl font-bold', summary.leftover >= 0 ? 'text-[#548164]' : 'text-[#C4554D]')}>
                    {formatMoney(summary.leftover)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
