import { AnimatePresence, motion } from 'motion/react'
import { Bell, X } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { DueReminder } from '@/lib/reminders'

interface InvoiceReminderBannersProps {
  dueReminders: DueReminder[]
  onCreateInvoice: (clientName: string) => void
  onDismiss: (reminderId: string) => void
}

export function InvoiceReminderBanners({ dueReminders, onCreateInvoice, onDismiss }: InvoiceReminderBannersProps) {
  if (dueReminders.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mb-6">
      <AnimatePresence initial={false}>
        {dueReminders.map(({ reminder }) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-[#E9F3F7] border border-[#CFE3ED] rounded-2xl px-4 py-3"
          >
            <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#487CA5]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">Time to invoice {reminder.client_name}</p>
              {reminder.notes && <p className="text-xs text-gray-500 truncate">{reminder.notes}</p>}
            </div>
            <PrimaryButton
              onClick={() => onCreateInvoice(reminder.client_name)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium shrink-0"
            >
              Create Invoice
            </PrimaryButton>
            <button
              onClick={() => onDismiss(reminder.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition shrink-0"
              title="Dismiss until next month"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
