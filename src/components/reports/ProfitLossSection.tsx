import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { computeProfitAndLoss } from '@/lib/reports'
import { parseLocalDate } from '@/lib/utils'
import { CATEGORY_CHART_COLORS } from '@/types'
import type { Invoice, Expense } from '@/types'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function startOfYearStr() {
  return `${new Date().getFullYear()}-01-01`
}

interface ProfitLossSectionProps {
  invoices: Invoice[]
  expenses: Expense[]
}

export function ProfitLossSection({ invoices, expenses }: ProfitLossSectionProps) {
  const [startDateStr, setStartDateStr] = useState(startOfYearStr)
  const [endDateStr, setEndDateStr] = useState(todayStr)

  const result = useMemo(() => {
    return computeProfitAndLoss(invoices, expenses, parseLocalDate(startDateStr), parseLocalDate(endDateStr))
  }, [invoices, expenses, startDateStr, endDateStr])

  return (
    <section>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900">Profit &amp; Loss</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            max={endDateStr}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            min={startDateStr}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">Income, expenses, and net profit for any date range you pick.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard
          label="Income"
          value={result.income}
          format={formatMoney}
          icon={<TrendingUp className="w-5 h-5 text-[#548164]" />}
          iconBg="bg-[#EEF3ED]"
        />
        <StatCard
          label="Expenses"
          value={result.totalExpenses}
          format={formatMoney}
          delay={0.05}
          icon={<TrendingDown className="w-5 h-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Net Profit"
          value={result.netProfit}
          format={formatMoney}
          delay={0.1}
          glow={result.netProfit > 0}
          icon={<DollarSign className="w-5 h-5 text-[#487CA5]" />}
          iconBg="bg-[#E9F3F7]"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Expenses by Category</h3>
        </div>
        {result.expensesByCategory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No expenses in this range</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {result.expensesByCategory.map((line) => {
                  const pct = result.totalExpenses > 0 ? (line.amount / result.totalExpenses) * 100 : 0
                  return (
                    <tr key={line.category} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CATEGORY_CHART_COLORS[line.category] ?? '#8fa3ab' }}
                          />
                          <span className="text-sm text-gray-700">{line.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 text-right w-20">{pct.toFixed(0)}%</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatMoney(line.amount)}</td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50/60">
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">{formatMoney(result.totalExpenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
