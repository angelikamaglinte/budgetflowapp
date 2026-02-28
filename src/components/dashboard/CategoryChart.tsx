import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Expense } from '@/types'
import { CATEGORY_CHART_COLORS } from '@/types'

interface CategoryChartProps {
  expenses: Expense[]
}

export function CategoryChart({ expenses }: CategoryChartProps) {
  const categoryTotals: Record<string, number> = {}
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] ?? 0) + exp.amount
  }

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-1">Expense by Category</h3>
        <p className="text-xs text-gray-400 mb-5">This month</p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">No expenses yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <h3 className="font-semibold text-gray-900 mb-1">Expense by Category</h3>
      <p className="text-xs text-gray-400 mb-4">All time</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_CHART_COLORS[entry.name] ?? '#9ca3af'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Amount']}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
