import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Task } from '@/types'
import { Modal } from '@/components/ui/Modal'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  due_date: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: TaskFormValues) => Promise<void>
  initial?: Task
}

export function TaskForm({ open, onClose, onSubmit, initial }: TaskFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as Resolver<TaskFormValues>,
    defaultValues: { title: '', due_date: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: initial?.title ?? '',
        due_date: initial?.due_date ?? '',
      })
    }
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
            placeholder="Follow up with client about contract"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Due date (optional)</label>
          <input
            {...register('due_date')}
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-400">Tasks with a due date also show up on your Calendar.</p>
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
