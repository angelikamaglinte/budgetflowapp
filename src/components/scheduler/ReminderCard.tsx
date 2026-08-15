import { motion } from 'motion/react'
import { Pencil, Trash2, CalendarClock } from 'lucide-react'
import type { InvoiceReminder } from '@/types'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

interface ReminderCardProps {
  reminder: InvoiceReminder
  delay?: number
  onEdit: () => void
  onDelete: () => void
}

export function ReminderCard({ reminder, delay = 0, onEdit, onDelete }: ReminderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-medium text-gray-900 truncate">{reminder.client_name}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E9F3F7] text-[#487CA5] mb-2">
        <CalendarClock className="w-3.5 h-3.5" />
        {ordinal(reminder.reminder_day)} of every month
      </div>
      {reminder.notes && <p className="text-xs text-gray-400">{reminder.notes}</p>}
    </motion.div>
  )
}
