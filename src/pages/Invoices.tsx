import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Plus, Search, Pencil, Trash2, CheckCircle, Download, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { StatusBadge } from '@/components/invoices/StatusBadge'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import type { InvoiceFormValues } from '@/components/invoices/InvoiceForm'
import { TransferChecklistModal } from '@/components/invoices/TransferChecklistModal'
import { useInvoices, useAddInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices'
import { useAddNotification } from '@/hooks/useNotifications'
import { useAuth } from '@/contexts/AuthContext'
import { useAllocation } from '@/contexts/AllocationContext'
import { exportInvoices } from '@/lib/export'
import { getEffectiveStatus } from '@/lib/invoiceStatus'
import type { Invoice } from '@/types'
import { usePeriod, matchesPeriod } from '@/contexts/PeriodContext'
import { cn, parseLocalDate } from '@/lib/utils'

type SortKey = 'invoice_number' | 'client_name' | 'issue_date' | 'due_date' | 'date_paid' | 'status' | 'amount'
type SortDir = 'asc' | 'desc'

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  invoice_number: 'asc',
  client_name: 'asc',
  issue_date: 'desc',
  due_date: 'desc',
  date_paid: 'desc',
  status: 'asc',
  amount: 'desc',
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <th className={cn('text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4', align === 'right' ? 'text-right' : 'text-left', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-1 transition-colors hover:text-gray-700',
          align === 'right' && 'ml-auto',
          active && 'text-gray-600'
        )}
      >
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  )
}

export default function Invoices() {
  const { user } = useAuth()
  const { taxRate, savingsRate } = useAllocation()
  const { data: invoices = [], isLoading } = useInvoices()

  const nextInvoiceNumber = useMemo(() => {
    let max = 0
    for (const inv of invoices) {
      const match = inv.invoice_number.match(/(\d+)\s*$/)
      if (match) max = Math.max(max, parseInt(match[1], 10))
    }
    return `INV-${String(max + 1).padStart(3, '0')}`
  }, [invoices])
  const addInvoice = useAddInvoice()
  const updateInvoice = useUpdateInvoice()
  const deleteInvoice = useDeleteInvoice()
  const addNotification = useAddNotification()

  const { periodFilter } = usePeriod()
  const location = useLocation()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Invoice | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [prefillClientName, setPrefillClientName] = useState<string | undefined>(undefined)
  const [transferChecklistInvoice, setTransferChecklistInvoice] = useState<Invoice | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('issue_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(DEFAULT_DIR[key])
    }
  }

  useEffect(() => {
    const state = location.state as { prefillClientName?: string } | null
    if (state?.prefillClientName) {
      setEditTarget(null)
      setPrefillClientName(state.prefillClientName)
      setFormOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [])

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchPeriod = matchesPeriod(inv.date_paid ?? inv.issue_date, periodFilter)
      const matchSearch =
        inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter ? getEffectiveStatus(inv) === statusFilter : true
      return matchPeriod && matchSearch && matchStatus
    })
  }, [invoices, periodFilter, search, statusFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp: number
      switch (sortKey) {
        case 'invoice_number':
          cmp = a.invoice_number.localeCompare(b.invoice_number)
          break
        case 'client_name':
          cmp = a.client_name.localeCompare(b.client_name)
          break
        case 'status':
          cmp = getEffectiveStatus(a).localeCompare(getEffectiveStatus(b))
          break
        case 'amount':
          cmp = a.amount - b.amount
          break
        default: {
          // Nullable date columns: rows missing the date always sort last.
          const aVal = a[sortKey]
          const bVal = b[sortKey]
          if (!aVal && !bVal) cmp = 0
          else if (!aVal) return 1
          else if (!bVal) return -1
          else cmp = new Date(aVal).getTime() - new Date(bVal).getTime()
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

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
      await addInvoice.mutateAsync({ ...values, user_id: user!.id })
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
    setTransferChecklistInvoice(inv)
    const taxAmount = inv.amount * (taxRate / 100)
    const savingsAmount = inv.amount * (savingsRate / 100)
    void addNotification.mutateAsync({
      user_id: user!.id,
      message: `Invoice ${inv.invoice_number} marked paid — move $${taxAmount.toFixed(2)} to tax, $${savingsAmount.toFixed(2)} to savings.`,
      link: '/invoices',
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
          <PrimaryButton
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </PrimaryButton>
        </div>
      }
    >
      {/* Summary pills */}
      {invoices.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-xl text-sm"
          >
            <span className="text-green-500 font-medium">Paid</span>
            <span className="font-bold text-green-700">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-sm"
          >
            <span className="text-amber-500 font-medium">Pending</span>
            <span className="font-bold text-amber-700">
              ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </motion.div>
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {search || statusFilter ? 'No invoices match your filters' : 'No invoices yet — create your first one!'}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden flex flex-col divide-y divide-gray-50">
              {sorted.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                  className="p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{inv.client_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inv.invoice_number} · {format(parseLocalDate(inv.issue_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={getEffectiveStatus(inv)} />
                    <div className="flex items-center gap-1 shrink-0">
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
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
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
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Table (tablet+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <SortHeader label="Invoice #" active={sortKey === 'invoice_number'} dir={sortDir} onClick={() => toggleSort('invoice_number')} className="px-6" />
                    <SortHeader label="Client" active={sortKey === 'client_name'} dir={sortDir} onClick={() => toggleSort('client_name')} />
                    <SortHeader
                      label="Issue Date"
                      active={sortKey === 'issue_date'}
                      dir={sortDir}
                      onClick={() => toggleSort('issue_date')}
                      className="hidden md:table-cell"
                    />
                    <SortHeader
                      label="Due Date"
                      active={sortKey === 'due_date'}
                      dir={sortDir}
                      onClick={() => toggleSort('due_date')}
                      className="hidden lg:table-cell"
                    />
                    <SortHeader
                      label="Date Paid"
                      active={sortKey === 'date_paid'}
                      dir={sortDir}
                      onClick={() => toggleSort('date_paid')}
                      className="hidden lg:table-cell"
                    />
                    <SortHeader label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
                    <SortHeader label="Amount" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggleSort('amount')} align="right" />
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
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
                        {format(parseLocalDate(inv.issue_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {inv.due_date ? format(parseLocalDate(inv.due_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {inv.date_paid ? (
                          <span className="text-sm text-green-600 font-medium">
                            {format(parseLocalDate(inv.date_paid!), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={getEffectiveStatus(inv)} />
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
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <InvoiceForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); setPrefillClientName(undefined) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
        nextInvoiceNumber={nextInvoiceNumber}
        defaultClientName={prefillClientName}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
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
              onClick={() => deleteId && void handleDelete(deleteId)}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {transferChecklistInvoice && (
        <TransferChecklistModal
          open={!!transferChecklistInvoice}
          onClose={() => setTransferChecklistInvoice(null)}
          invoiceNumber={transferChecklistInvoice.invoice_number}
          amount={transferChecklistInvoice.amount}
          taxRate={taxRate}
          savingsRate={savingsRate}
        />
      )}
    </AppLayout>
  )
}
