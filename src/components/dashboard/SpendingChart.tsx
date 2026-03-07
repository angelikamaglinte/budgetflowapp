import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Expense } from '@/types'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'

interface SpendingChartProps {
  expenses: Expense[]
}

function buildMonthlyData(expenses: Expense[]) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      month: format(d, 'MMM'),
      start: startOfMonth(d),
      end: endOfMonth(d),
      amount: 0,
    }
  })

  for (const exp of expenses) {
    const d = parseLocalDate(exp.date)
    const bucket = months.find((m) => d >= m.start && d <= m.end)
    if (bucket) bucket.amount += exp.amount
  }

  return months.map(({ month, amount }) => ({ month, amount }))
}

export function SpendingChart({ expenses }: SpendingChartProps) {
  const data = buildMonthlyData(expenses)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <h3 className="font-semibold text-gray-900 mb-1">Spending Over Time</h3>
      <p className="text-xs text-gray-400 mb-5">Last 6 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Spent']}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fill="url(#spendingGrad)"
            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#7c3aed', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
