import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { InvoiceReminder } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { useContacts } from '@/hooks/useContacts'
import { DayOfMonthPicker } from './DayOfMonthPicker'

const reminderSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  reminder_day: z.coerce.number().int().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31'),
  notes: z.string().optional(),
})

export type ReminderFormValues = z.infer<typeof reminderSchema>

interface ReminderFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: ReminderFormValues) => Promise<void>
  initial?: InvoiceReminder
}

export function ReminderForm({ open, onClose, onSubmit, initial }: ReminderFormProps) {
  const { data: contacts = [] } = useContacts()
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema) as Resolver<ReminderFormValues>,
    defaultValues: {
      client_name: '',
      reminder_day: '' as unknown as number,
      notes: '',
    },
  })

  const watchedDay = useWatch({ control, name: 'reminder_day' })

  useEffect(() => {
    if (open) {
      reset({
        client_name: initial?.client_name ?? '',
        reminder_day: initial?.reminder_day ?? ('' as unknown as number),
        notes: initial?.notes ?? '',
      })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{initial ? 'Edit Reminder' : 'New Reminder'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
          <input
            {...register('client_name')}
            list="reminder-client-names"
            placeholder="e.g. Satori Bear Inc"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <datalist id="reminder-client-names">
            {contacts.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          {errors.client_name && <p className="mt-1 text-xs text-red-600">{errors.client_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Remind me on day</label>
          <DayOfMonthPicker
            value={watchedDay || undefined}
            onChange={(day) => setValue('reminder_day', day, { shouldValidate: true })}
          />
          <input type="hidden" {...register('reminder_day')} />
          {errors.reminder_day && <p className="mt-1 text-xs text-red-600">{errors.reminder_day.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Anything to remember when you invoice them..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition"
          >
            {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Add reminder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
