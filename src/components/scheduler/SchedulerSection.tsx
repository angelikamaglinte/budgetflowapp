import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, CalendarClock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { ReminderForm } from './ReminderForm'
import type { ReminderFormValues } from './ReminderForm'
import { ReminderCard } from './ReminderCard'
import {
  useInvoiceReminders,
  useAddInvoiceReminder,
  useUpdateInvoiceReminder,
  useDeleteInvoiceReminder,
} from '@/hooks/useInvoiceReminders'
import { useAuth } from '@/contexts/AuthContext'
import type { InvoiceReminder } from '@/types'

export function SchedulerSection() {
  const { user } = useAuth()
  const { data: reminders = [], isLoading } = useInvoiceReminders()
  const addReminder = useAddInvoiceReminder()
  const updateReminder = useUpdateInvoiceReminder()
  const deleteReminder = useDeleteInvoiceReminder()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<InvoiceReminder | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSubmit(values: ReminderFormValues) {
    if (editTarget) {
      await updateReminder.mutateAsync({ id: editTarget.id, ...values })
    } else {
      await addReminder.mutateAsync({ ...values, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(reminder: InvoiceReminder) {
    setEditTarget(reminder)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteReminder.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-sm text-gray-500">
          Set a recurring day of the month for each client, and a banner will appear on your Dashboard once that day arrives.
        </p>
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </PrimaryButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <CalendarClock className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-gray-500 text-sm">No reminders yet</p>
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            Add a reminder
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map((r, i) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              delay={Math.min(i, 15) * 0.05}
              onEdit={() => openEdit(r)}
              onDelete={() => setDeleteId(r.id)}
            />
          ))}
        </div>
      )}

      <ReminderForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this reminder?</h3>
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
    </div>
  )
}
