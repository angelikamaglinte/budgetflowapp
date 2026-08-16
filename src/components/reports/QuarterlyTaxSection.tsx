import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { computeQuarterlyTaxSummary } from '@/lib/reports'
import type { Invoice, Expense } from '@/types'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface QuarterlyTaxSectionProps {
  invoices: Invoice[]
  expenses: Expense[]
  taxRate: number
}

export function QuarterlyTaxSection({ invoices, expenses, taxRate }: QuarterlyTaxSectionProps) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const quarters = useMemo(
    () => computeQuarterlyTaxSummary(invoices, expenses, taxRate, year),
    [invoices, expenses, taxRate, year]
  )

  const yearTotals = quarters.reduce(
    (acc, q) => ({
      income: acc.income + q.income,
      taxReserve: acc.taxReserve + q.taxReserve,
      businessExpenses: acc.businessExpenses + q.businessExpenses,
    }),
    { income: 0, taxReserve: 0, businessExpenses: 0 }
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">Quarterly Estimated Tax</h2>
        <div className="flex items-center gap-2">
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
        Income received and tax reserve accumulated per quarter, at your {taxRate}% rate — a starting point for
        estimated tax payments, not tax advice.
      </p>

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)] mb-4">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={quarters} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8fa3ab' }} axisLine={false} tickLine={false} />
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
            <Bar dataKey="income" name="Income" fill="#548164" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="taxReserve" name="Tax Reserve" fill="#C4554D" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="businessExpenses" name="Business Expenses" fill="#487CA5" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Quarter</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Income</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Tax Reserve</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Business Expenses</th>
            </tr>
          </thead>
          <tbody>
            {quarters.map((q) => (
              <tr key={q.quarter} className="border-b border-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{q.label}</td>
                <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatMoney(q.income)}</td>
                <td className="px-4 py-3 text-sm text-[#C4554D] font-medium text-right">{formatMoney(q.taxReserve)}</td>
                <td className="px-6 py-3 text-sm text-gray-700 text-right">{formatMoney(q.businessExpenses)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50/60">
              <td className="px-6 py-3 text-sm font-bold text-gray-900">Year total</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatMoney(yearTotals.income)}</td>
              <td className="px-4 py-3 text-sm font-bold text-[#C4554D] text-right">{formatMoney(yearTotals.taxReserve)}</td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">{formatMoney(yearTotals.businessExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
