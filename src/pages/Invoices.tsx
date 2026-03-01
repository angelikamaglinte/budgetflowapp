import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, Search, Pencil, Trash2, CheckCircle, Download } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatusBadge } from '@/components/invoices/StatusBadge'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import type { InvoiceFormValues } from '@/components/invoices/InvoiceForm'
import { useInvoices, useAddInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices'
import { exportInvoices } from '@/lib/export'
import type { Invoice } from '@/types'
import { usePeriod, matchesPeriod } from '@/contexts/PeriodContext'

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices()
  const addInvoice = useAddInvoice()
  const updateInvoice = useUpdateInvoice()
  const deleteInvoice = useDeleteInvoice()

  const { periodFilter } = usePeriod()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Invoice | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchPeriod = matchesPeriod(inv.issue_date, periodFilter)
      const matchSearch =
        inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter ? inv.status === statusFilter : true
      return matchPeriod && matchSearch && matchStatus
    })
  }, [invoices, periodFilter, search, statusFilter])

  const totalPaid = filtered
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0)
  const totalPending = filtered
    .filter((i) => i.status === 'pending')
    .reduce((s, i) => s + i.amount, 0)

  async function handleSubmit(values: InvoiceFormValues) {
    if (editTarget) {
      await updateInvoice.mutateAsync({ id: editTarget.id, ...values })
    } else {
      await addInvoice.mutateAsync(values)
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  async function markPaid(inv: Invoice) {
    await updateInvoice.mutateAsync({
      id: inv.id,
      status: 'paid',
      date_paid: new Date().toISOString().split('T')[0],
    })
  }

  async function handleDelete(id: string) {
    await deleteInvoice.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <AppLayout
      title="Invoices"
      subtitle="Manage invoices you send to clients"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoices(filtered)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      }
    >
      {/* Summary pills */}
      {invoices.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-xl text-sm">
            <span className="text-green-500 font-medium">Paid</span>
            <span className="font-bold text-green-700">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-sm">
            <span className="text-amber-500 font-medium">Pending</span>
            <span className="font-bold text-amber-700">
              ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {search || statusFilter ? 'No invoices match your filters' : 'No invoices yet — create your first one!'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Invoice #</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Client</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Issue Date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Due Date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Date Paid</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Status</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Amount</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{inv.invoice_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{inv.client_name}</p>
                    {inv.client_email && (
                      <p className="text-xs text-gray-400">{inv.client_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {format(new Date(inv.issue_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                    {inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {inv.date_paid ? (
                      <span className="text-sm text-green-600 font-medium">
                        {format(new Date(inv.date_paid), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => void markPaid(inv)}
                          title="Mark as paid"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditTarget(inv); setFormOpen(true) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(inv.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InvoiceForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Delete invoice?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
