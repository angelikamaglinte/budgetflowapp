import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeYearOverYear } from '@/lib/reports'
import type { Invoice, Expense } from '@/types'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface YearOverYearSectionProps {
  invoices: Invoice[]
  expenses: Expense[]
}

export function YearOverYearSection({ invoices, expenses }: YearOverYearSectionProps) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [metric, setMetric] = useState<'income' | 'expenses'>('income')
  const months = useMemo(() => computeYearOverYear(invoices, expenses, year), [invoices, expenses, year])

  const currentTotal = months.reduce((s, m) => s + (metric === 'income' ? m.currentYearIncome : m.currentYearExpenses), 0)
  const previousTotal = months.reduce((s, m) => s + (metric === 'income' ? m.previousYearIncome : m.previousYearExpenses), 0)
  const pctChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null

  const chartData = months.map((m) => ({
    label: m.monthLabel,
    current: metric === 'income' ? m.currentYearIncome : m.currentYearExpenses,
    previous: metric === 'income' ? m.previousYearIncome : m.previousYearExpenses,
  }))

  return (
    <section>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900">Year-over-Year Comparison</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setMetric('income')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                metric === 'income' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
              )}
            >
              Income
            </button>
            <button
              onClick={() => setMetric('expenses')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                metric === 'expenses' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
              )}
            >
              Expenses
            </button>
          </div>
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 w-12 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {formatMoney(currentTotal)} in {year} vs {formatMoney(previousTotal)} in {year - 1}
        {pctChange !== null && (
          <span className={cn('font-medium ml-1', pctChange >= 0 ? 'text-[#548164]' : 'text-[#C4554D]')}>
            ({pctChange >= 0 ? '+' : ''}{pctChange.toFixed(0)}%)
          </span>
        )}
      </p>
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8fa3ab' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#8fa3ab' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #e9e9e7',
                borderRadius: '12px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(v: number | undefined, name: string | undefined) => [`$${(v ?? 0).toFixed(2)}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="current" name={String(year)} fill="#142127" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="previous" name={String(year - 1)} fill="#c7d1d4" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
