import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Expense, Invoice } from '@/types'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'

interface IncomeExpenseChartProps {
  expenses: Expense[]
  invoices: Invoice[]
}

function buildData(expenses: Expense[], invoices: Invoice[]) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)

    const income = invoices
      .filter((inv) => inv.status === 'paid' && parseLocalDate(inv.issue_date) >= start && parseLocalDate(inv.issue_date) <= end)
      .reduce((sum, inv) => sum + inv.amount, 0)

    const spent = expenses
      .filter((exp) => parseLocalDate(exp.date) >= start && parseLocalDate(exp.date) <= end)
      .reduce((sum, exp) => sum + exp.amount, 0)

    return { month: format(d, 'MMM'), income, expenses: spent }
  })
}

export function IncomeExpenseChart({ expenses, invoices }: IncomeExpenseChartProps) {
  const data = buildData(expenses, invoices)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <h3 className="font-semibold text-gray-900 mb-1">Income vs Expenses</h3>
      <p className="text-xs text-gray-400 mb-5">Last 6 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
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
            formatter={(v: number | undefined, name: string | undefined) => [`$${(v ?? 0).toFixed(2)}`, name === 'income' ? 'Income' : 'Expenses']}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {value === 'income' ? 'Income' : 'Expenses'}
              </span>
            )}
          />
          <Bar dataKey="income" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expenses" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
