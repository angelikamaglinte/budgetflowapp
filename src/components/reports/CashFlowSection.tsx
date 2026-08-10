import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Receipt, Target } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { computeCashFlowForecast } from '@/lib/reports'
import type { Invoice, Expense } from '@/types'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CashFlowSection({ invoices, expenses }: { invoices: Invoice[]; expenses: Expense[] }) {
  const forecast = useMemo(() => computeCashFlowForecast(invoices, expenses), [invoices, expenses])

  const expenseCaption = forecast.monthsOfDataUsed === 0
    ? 'Not enough expense history yet'
    : `Based on last ${forecast.monthsOfDataUsed} month${forecast.monthsOfDataUsed === 1 ? '' : 's'}`

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Cash Flow Forecast</h2>
      <p className="text-sm text-gray-500 mb-4">A directional projection — expected invoice income against your recent average expenses.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <StatCard
          label="Expected Incoming"
          value={forecast.expectedIncoming}
          format={formatMoney}
          icon={<TrendingUp className="w-5 h-5 text-[#548164]" />}
          iconBg="bg-[#EEF3ED]"
        />
        <StatCard
          label="Avg Monthly Expenses"
          value={forecast.avgMonthlyExpenses}
          format={formatMoney}
          delay={0.05}
          icon={<Receipt className="w-5 h-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Projected 30-Day Net"
          value={forecast.projectedNet30}
          format={formatMoney}
          delay={0.1}
          glow={forecast.projectedNet30 > 0}
          icon={<Target className="w-5 h-5 text-[#487CA5]" />}
          iconBg="bg-[#E9F3F7]"
        />
      </div>
      <p className="text-xs text-gray-400 mb-5 sm:col-start-2">{expenseCaption}</p>

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
        <h3 className="font-semibold text-gray-900 mb-1">Expected Incoming by Timeframe</h3>
        <p className="text-xs text-gray-400 mb-5">Dashed line marks your average monthly expenses</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={forecast.incomingBuckets} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#8fa3ab' }}
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
              formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Expected']}
            />
            {forecast.avgMonthlyExpenses > 0 && (
              <ReferenceLine
                y={forecast.avgMonthlyExpenses}
                stroke="#142127"
                strokeDasharray="4 4"
                label={{ value: 'Avg monthly expenses', position: 'insideTopRight', fontSize: 11, fill: '#142127' }}
              />
            )}
            <Bar dataKey="amount" fill="#487CA5" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
