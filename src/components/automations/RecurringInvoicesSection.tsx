import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { RecurringInvoiceForm } from './RecurringInvoiceForm'
import type { RecurringInvoiceFormValues } from './RecurringInvoiceForm'
import { RecurringInvoiceCard } from './RecurringInvoiceCard'
import {
  useRecurringInvoices,
  useAddRecurringInvoice,
  useUpdateRecurringInvoice,
  useDeleteRecurringInvoice,
} from '@/hooks/useRecurringInvoices'
import { useAuth } from '@/contexts/AuthContext'
import type { RecurringInvoice } from '@/types'

export function RecurringInvoicesSection() {
  const { user } = useAuth()
  const { data: items = [], isLoading } = useRecurringInvoices()
  const addItem = useAddRecurringInvoice()
  const updateItem = useUpdateRecurringInvoice()
  const deleteItem = useDeleteRecurringInvoice()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RecurringInvoice | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSubmit(values: RecurringInvoiceFormValues) {
    const payload = {
      ...values,
      client_company: values.client_company || null,
      client_address: values.client_address || null,
      terms: values.terms || null,
      thank_you_note: values.thank_you_note || null,
      due_in_days: values.due_in_days === '' || values.due_in_days === undefined ? null : Number(values.due_in_days),
      line_items: values.line_items.map((item) => ({
        description: item.description,
        qty: Number(item.qty),
        rate: Number(item.rate),
      })),
    }
    if (editTarget) {
      await updateItem.mutateAsync({ id: editTarget.id, ...payload })
    } else {
      await addItem.mutateAsync({ ...payload, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(item: RecurringInvoice) {
    setEditTarget(item)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteItem.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-sm text-gray-500">
          Save a client + line-item template and a new invoice drafts itself in Invoice Builder automatically once its day arrives.
        </p>
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" /> New Recurring Invoice
        </PrimaryButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-gray-500 text-sm">No recurring invoices yet</p>
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            Add one
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <RecurringInvoiceCard
              key={item.id}
              item={item}
              delay={Math.min(i, 15) * 0.05}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
              onToggleActive={() => void updateItem.mutateAsync({ id: item.id, active: !item.active })}
            />
          ))}
        </div>
      )}

      <RecurringInvoiceForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this recurring invoice?</h3>
          <p className="text-sm text-gray-500 mb-5">Invoices it already created won't be affected. This action cannot be undone.</p>
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
    </div>
  )
}
