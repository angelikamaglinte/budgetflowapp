import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { computeUpcomingRevenue } from '@/lib/reports'
import type { Invoice, RecurringInvoice } from '@/types'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface UpcomingRevenueSectionProps {
  invoices: Invoice[]
  recurringInvoices: RecurringInvoice[]
}

export function UpcomingRevenueSection({ invoices, recurringInvoices }: UpcomingRevenueSectionProps) {
  const months = useMemo(() => computeUpcomingRevenue(invoices, recurringInvoices), [invoices, recurringInvoices])
  const total = months.reduce((s, m) => s + m.pendingInvoices + m.recurringProjected, 0)

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Unbilled &amp; Upcoming Revenue</h2>
      <p className="text-sm text-gray-500 mb-4">
        Pending invoices plus projected income from active recurring invoices, over the next 3 months —{' '}
        <span className="font-medium text-gray-700">{formatMoney(total)}</span> total.
      </p>
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={months} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            <Bar dataKey="pendingInvoices" name="Pending Invoices" stackId="a" fill="#C29343" maxBarSize={48} />
            <Bar dataKey="recurringProjected" name="Recurring (projected)" stackId="a" fill="#487CA5" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
