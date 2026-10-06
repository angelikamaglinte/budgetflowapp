import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Link2 } from 'lucide-react'
import type { Task } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { RepeatPicker } from '@/components/scheduling/RepeatPicker'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  all_day: z.boolean().optional(),
  recurrence_rule: z.string().nullable().optional(),
  link_url: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Must start with http:// or https://'),
  description: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: TaskFormValues) => Promise<void>
  initial?: Task
}

function defaultValues(initial?: Task): TaskFormValues {
  return {
    title: initial?.title ?? '',
    due_date: initial?.due_date ?? '',
    due_time: initial?.due_time ?? '',
    all_day: initial?.all_day ?? true,
    recurrence_rule: initial?.recurrence_rule ?? null,
    link_url: initial?.link_url ?? '',
    description: initial?.description ?? '',
  }
}

export function TaskForm({ open, onClose, onSubmit, initial }: TaskFormProps) {
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as Resolver<TaskFormValues>,
    defaultValues: defaultValues(initial),
  })

  const dueDate = useWatch({ control, name: 'due_date' })
  const allDay = useWatch({ control, name: 'all_day' })
  const recurrenceRule = useWatch({ control, name: 'recurrence_rule' })

  useEffect(() => {
    if (open) reset(defaultValues(initial))
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{initial ? 'Edit Task' : 'New Task'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            {...register('title')}
            placeholder="Send QuickBooks Timesheet to Viktoriya"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date (optional)</label>
          <input
            {...register('due_date')}
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">Tasks with a date also show up on your Calendar.</p>
        </div>

        {dueDate && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 w-fit cursor-pointer mb-2">
                <input
                  {...register('all_day')}
                  type="checkbox"
                  className="w-4 h-4 accent-primary-600 cursor-pointer"
                />
                All-day
              </label>
              {!allDay && (
                <input
                  {...register('due_time')}
                  type="time"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Repeat</label>
              <RepeatPicker
                value={recurrenceRule ?? null}
                onChange={(rule) => setValue('recurrence_rule', rule)}
                startDate={dueDate}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Link (optional)</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              {...register('link_url')}
              placeholder="https://..."
              className="flex-1 min-w-0 text-sm focus:outline-none"
            />
          </div>
          {errors.link_url && <p className="mt-1 text-xs text-red-600">{errors.link_url.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Any additional notes..."
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
            {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
