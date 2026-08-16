import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { RecurringExpenseForm } from './RecurringExpenseForm'
import type { RecurringExpenseFormValues } from './RecurringExpenseForm'
import { RecurringExpenseCard } from './RecurringExpenseCard'
import {
  useRecurringExpenses,
  useAddRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
} from '@/hooks/useRecurringExpenses'
import { useAuth } from '@/contexts/AuthContext'
import type { RecurringExpense } from '@/types'

export function RecurringExpensesSection() {
  const { user } = useAuth()
  const { data: items = [], isLoading } = useRecurringExpenses()
  const addItem = useAddRecurringExpense()
  const updateItem = useUpdateRecurringExpense()
  const deleteItem = useDeleteRecurringExpense()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RecurringExpense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSubmit(values: RecurringExpenseFormValues) {
    if (editTarget) {
      await updateItem.mutateAsync({ id: editTarget.id, ...values })
    } else {
      await addItem.mutateAsync({ ...values, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(item: RecurringExpense) {
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
          Fixed monthly costs get logged to Expenses automatically once their day arrives — no need to add them by hand.
        </p>
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" /> New Recurring Expense
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
          <p className="text-gray-500 text-sm">No recurring expenses yet</p>
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
            <RecurringExpenseCard
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

      <RecurringExpenseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this recurring expense?</h3>
          <p className="text-sm text-gray-500 mb-5">Past expenses it already created won't be affected. This action cannot be undone.</p>
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
