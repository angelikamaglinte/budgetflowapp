import { useMemo } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Users } from 'lucide-react'
import { computeClientSummaries } from '@/lib/reports'
import type { Invoice } from '@/types'

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

export function ClientIncomeSection({ invoices }: { invoices: Invoice[] }) {
  const clients = useMemo(() => computeClientSummaries(invoices), [invoices])

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Client Income</h2>
      <p className="text-sm text-gray-500 mb-4">Revenue and payment behavior by client, ranked by total invoiced.</p>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-gray-500 text-sm">No client data yet — add an invoice to see client insights</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden flex flex-col divide-y divide-gray-50">
              {clients.map((c, i) => (
                <motion.div
                  key={c.clientName}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                  className="p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{c.clientName}</p>
                      {c.isChronicLatePayer && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAF3DD] text-[#C29343]">
                          <AlertTriangle className="w-3 h-3" /> Pays late
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">{money(c.totalInvoiced)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{c.invoiceCount} invoice{c.invoiceCount === 1 ? '' : 's'}</span>
                    <span>Avg payment: {c.avgPaymentDays !== null ? `${c.avgPaymentDays}d` : '—'}</span>
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
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Invoiced</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Paid</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Pending</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Avg Payment Time</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c, i) => (
                    <motion.tr
                      key={c.clientName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">{c.clientName}</p>
                          {c.isChronicLatePayer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FAF3DD] text-[#C29343]">
                              <AlertTriangle className="w-3 h-3" /> Pays late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">{money(c.totalInvoiced)}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-500 hidden md:table-cell">{money(c.totalPaid)}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-500 hidden md:table-cell">{money(c.totalPending)}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-500 hidden lg:table-cell">
                        {c.avgPaymentDays !== null ? `${c.avgPaymentDays} days` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{c.invoiceCount}</td>
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
