import { useMemo } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/components/invoices/StatusBadge'
import { AgingBadge } from './AgingBadge'
import { computeInvoiceAging } from '@/lib/reports'
import { parseLocalDate } from '@/lib/utils'
import type { Invoice } from '@/types'

const PILLS: { key: 'overdue' | 'due-soon' | 'upcoming'; label: string; className: string; valueClassName: string }[] = [
  { key: 'overdue', label: 'Overdue', className: 'bg-[#FAECEC] border-[#F3D8D8]', valueClassName: 'text-[#C4554D]' },
  { key: 'due-soon', label: 'Due Soon', className: 'bg-[#FAF3DD] border-[#F2E6BF]', valueClassName: 'text-[#C29343]' },
  { key: 'upcoming', label: 'Upcoming', className: 'bg-[#E9F3F7] border-[#D5E7EE]', valueClassName: 'text-[#487CA5]' },
]

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

export function InvoiceAgingSection({ invoices }: { invoices: Invoice[] }) {
  const aging = useMemo(() => computeInvoiceAging(invoices), [invoices])

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Invoice Aging</h2>
      <p className="text-sm text-gray-500 mb-4">Outstanding invoices, ranked by urgency — based on due date, not just stored status.</p>

      {aging.items.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {PILLS.map((pill, i) => (
            <motion.div
              key={pill.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm ${pill.className}`}
            >
              <span className={`font-medium ${pill.valueClassName}`}>{pill.label}</span>
              <span className={`font-bold ${pill.valueClassName}`}>{money(aging.totals[pill.key].amount)}</span>
              <span className="text-xs text-gray-400">({aging.totals[pill.key].count})</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        {aging.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-[#EEF3ED] rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#548164]" />
            </div>
            <p className="text-gray-500 text-sm">All caught up — no outstanding invoices</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden flex flex-col divide-y divide-gray-50">
              {aging.items.map((item, i) => (
                <motion.div
                  key={item.invoice.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                  className="p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.invoice.client_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.invoice.invoice_number}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {money(item.invoice.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <AgingBadge agedInvoice={item} />
                    <StatusBadge status={item.invoice.status} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Table (tablet+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Client</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Invoice #</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Due Date</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Aging</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.items.map((item, i) => (
                    <motion.tr
                      key={item.invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{item.invoice.client_name}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{item.invoice.invoice_number}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {item.invoice.due_date ? format(parseLocalDate(item.invoice.due_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <AgingBadge agedInvoice={item} />
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <StatusBadge status={item.invoice.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">{money(item.invoice.amount)}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
