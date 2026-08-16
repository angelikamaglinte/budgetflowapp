import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Briefcase, User } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/types'
import type { RecurringExpense } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { DayOfMonthPicker } from '@/components/scheduler/DayOfMonthPicker'
import { cn } from '@/lib/utils'

const recurringExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  vendor: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['business', 'personal']),
  amount: z.coerce.number().positive('Amount must be positive'),
  day_of_month: z.coerce.number().int().min(1, 'Pick a day').max(31, 'Pick a day'),
  notes: z.string().optional(),
})

export type RecurringExpenseFormValues = z.infer<typeof recurringExpenseSchema>

interface RecurringExpenseFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: RecurringExpenseFormValues) => Promise<void>
  initial?: RecurringExpense
}

export function RecurringExpenseForm({ open, onClose, onSubmit, initial }: RecurringExpenseFormProps) {
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } =
    useForm<RecurringExpenseFormValues>({
      resolver: zodResolver(recurringExpenseSchema) as Resolver<RecurringExpenseFormValues>,
      defaultValues: {
        title: '',
        vendor: '',
        category: '',
        type: 'business',
        amount: '' as unknown as number,
        day_of_month: '' as unknown as number,
        notes: '',
      },
    })

  const currentType = useWatch({ control, name: 'type' })
  const watchedDay = useWatch({ control, name: 'day_of_month' })

  useEffect(() => {
    if (open) {
      reset({
        title: initial?.title ?? '',
        vendor: initial?.vendor ?? '',
        category: initial?.category ?? '',
        type: (initial?.type as 'business' | 'personal') ?? 'business',
        amount: initial?.amount ?? ('' as unknown as number),
        day_of_month: initial?.day_of_month ?? ('' as unknown as number),
        notes: initial?.notes ?? '',
      })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{initial ? 'Edit Recurring Expense' : 'New Recurring Expense'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expense type</label>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setValue('type', 'business')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                currentType === 'business' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Briefcase className="w-3.5 h-3.5" /> Business
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'personal')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                currentType === 'personal' ? 'bg-white text-[#B35488] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <User className="w-3.5 h-3.5" /> Personal
            </button>
          </div>
          <input type="hidden" {...register('type')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            {...register('title')}
            placeholder="e.g. Adobe Creative Cloud"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($)</label>
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              {...register('category')}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor (optional)</label>
          <input
            {...register('vendor')}
            placeholder="e.g. Adobe Inc."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Log it on day</label>
          <DayOfMonthPicker
            value={watchedDay || undefined}
            onChange={(day) => setValue('day_of_month', day, { shouldValidate: true })}
          />
          <input type="hidden" {...register('day_of_month')} />
          {errors.day_of_month && <p className="mt-1 text-xs text-red-600">{errors.day_of_month.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
          <textarea
            {...register('notes')}
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
            {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Add recurring expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
