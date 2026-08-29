import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Receipt, Wallet } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/types'
import type { BudgetCategory, PayoutBucket } from '@/types'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

const budgetSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    monthly_target: z.coerce.number().positive('Must be greater than 0'),
    source_type: z.enum(['expense', 'bucket']),
    expense_category: z.string().optional(),
    bucket_id: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.source_type === 'expense' && !values.expense_category) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expense_category'], message: 'Category is required' })
    }
    if (values.source_type === 'bucket' && !values.bucket_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bucket_id'], message: 'Bucket is required' })
    }
  })

export type BudgetFormValues = z.infer<typeof budgetSchema>

interface BudgetFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: BudgetFormValues) => Promise<void>
  initial?: BudgetCategory
  buckets: PayoutBucket[]
}

export function BudgetForm({ open, onClose, onSubmit, initial, buckets }: BudgetFormProps) {
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } =
    useForm<BudgetFormValues>({
      resolver: zodResolver(budgetSchema) as Resolver<BudgetFormValues>,
      defaultValues: {
        name: initial?.name ?? '',
        monthly_target: initial?.monthly_target ?? ('' as unknown as number),
        source_type: (initial?.source_type as 'expense' | 'bucket') ?? 'expense',
        expense_category: initial?.expense_category ?? '',
        bucket_id: initial?.bucket_id ?? '',
      },
    })

  const currentSourceType = useWatch({ control, name: 'source_type' })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        monthly_target: initial?.monthly_target ?? ('' as unknown as number),
        source_type: (initial?.source_type as 'expense' | 'bucket') ?? 'expense',
        expense_category: initial?.expense_category ?? '',
        bucket_id: initial?.bucket_id ?? '',
      })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{initial ? 'Edit Budget' : 'Add Budget Category'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="budget-name" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input
            {...register('name')}
            id="budget-name"
            placeholder="e.g. Groceries"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="budget-target" className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Target ($)</label>
          <input
            {...register('monthly_target')}
            id="budget-target"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.monthly_target && <p className="mt-1 text-xs text-red-600">{errors.monthly_target.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Track against</label>
          <div className={cn('flex gap-2 p-1 bg-gray-100 rounded-xl', !!initial && 'opacity-60 pointer-events-none')}>
            <button
              type="button"
              onClick={() => setValue('source_type', 'expense')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                currentSourceType === 'expense'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setValue('source_type', 'bucket')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                currentSourceType === 'bucket'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Wallet className="w-3.5 h-3.5" />
              Payout Bucket
            </button>
          </div>
          <input type="hidden" {...register('source_type')} />
          {initial && (
            <p className="mt-1.5 text-xs text-gray-400">
              To change what this budget tracks, delete it and add a new one.
            </p>
          )}
        </div>

        {currentSourceType === 'expense' ? (
          <div>
            <label htmlFor="budget-expense-category" className="block text-sm font-medium text-gray-700 mb-1.5">Expense Category</label>
            <select
              {...register('expense_category')}
              id="budget-expense-category"
              disabled={!!initial}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:opacity-60"
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.expense_category && <p className="mt-1 text-xs text-red-600">{errors.expense_category.message}</p>}
          </div>
        ) : (
          <div>
            <label htmlFor="budget-bucket" className="block text-sm font-medium text-gray-700 mb-1.5">Payout Bucket</label>
            <select
              {...register('bucket_id')}
              id="budget-bucket"
              disabled={!!initial}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:opacity-60"
            >
              <option value="">Select bucket</option>
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
              ))}
            </select>
            {buckets.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Set up your payout buckets in Settings first.</p>
            )}
            {errors.bucket_id && <p className="mt-1 text-xs text-red-600">{errors.bucket_id.message}</p>}
          </div>
        )}

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
            {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Add budget'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
