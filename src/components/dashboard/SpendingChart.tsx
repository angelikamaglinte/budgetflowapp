import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'motion/react'
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]"
    >
      <h3 className="font-semibold text-gray-900 mb-1">Spending Over Time</h3>
      <p className="text-xs text-gray-400 mb-5">Last 6 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#142127" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#142127" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#8fa3ab' }}
            axisLine={false}
            tickLine={false}
          />
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
            formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Spent']}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#142127"
            strokeWidth={2.5}
            fill="url(#spendingGrad)"
            dot={{ r: 4, fill: '#142127', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#0d161a', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
