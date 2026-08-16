import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { computeCategoryTrend, CATEGORY_TREND_MONTHS } from '@/lib/reports'
import { CATEGORY_CHART_COLORS } from '@/types'
import type { Expense } from '@/types'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface CategorySpendingTrendSectionProps {
  expenses: Expense[]
}

export function CategorySpendingTrendSection({ expenses }: CategorySpendingTrendSectionProps) {
  const categoriesWithData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of expenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)
  }, [expenses])

  const [category, setCategory] = useState<string | null>(null)
  const activeCategory = category ?? categoriesWithData[0] ?? null

  const trend = useMemo(
    () => (activeCategory ? computeCategoryTrend(expenses, activeCategory) : []),
    [expenses, activeCategory]
  )
  const average = trend.length > 0 ? trend.reduce((s, p) => s + p.amount, 0) / trend.length : 0
  const lastMonth = trend[trend.length - 1]?.amount ?? 0
  const trendDelta = average > 0 ? ((lastMonth - average) / average) * 100 : 0

  if (categoriesWithData.length === 0 || !activeCategory) {
    return (
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Category Spending Trend</h2>
        <p className="text-sm text-gray-500">Add some expenses to see spending trends by category.</p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900">Category Spending Trend</h2>
        <select
          value={activeCategory}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {categoriesWithData.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Last {CATEGORY_TREND_MONTHS} months. Average {formatMoney(average)}/mo
        {lastMonth > 0 && Math.abs(trendDelta) >= 1 && (
          <> — last month was {trendDelta > 0 ? 'up' : 'down'} {Math.abs(trendDelta).toFixed(0)}% vs. average</>
        )}
        .
      </p>
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8fa3ab' }} axisLine={false} tickLine={false} interval={1} />
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
              formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, activeCategory]}
            />
            <Bar
              dataKey="amount"
              fill={CATEGORY_CHART_COLORS[activeCategory] ?? '#487CA5'}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
