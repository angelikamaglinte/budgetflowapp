import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { PurchasePlan } from '@/types'
import { Modal } from '@/components/ui/Modal'

const purchasePlanSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  target_date: z.string().optional(),
})

export type PurchasePlanFormValues = z.infer<typeof purchasePlanSchema>

interface PurchasePlanFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: PurchasePlanFormValues) => Promise<void>
  initial?: PurchasePlan
}

export function PurchasePlanForm({ open, onClose, onSubmit, initial }: PurchasePlanFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PurchasePlanFormValues>({
    resolver: zodResolver(purchasePlanSchema) as Resolver<PurchasePlanFormValues>,
    defaultValues: {
      item_name: '',
      price: '' as unknown as number,
      target_date: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        item_name: initial?.item_name ?? '',
        price: initial?.price ?? ('' as unknown as number),
        target_date: initial?.target_date ?? '',
      })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{initial ? 'Edit Purchase' : 'New Purchase'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">What are you saving for?</label>
          <input
            {...register('item_name')}
            placeholder="e.g. New MacBook Pro"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.item_name && <p className="mt-1 text-xs text-red-600">{errors.item_name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
            <input
              {...register('price')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target date (optional)</label>
            <input
              {...register('target_date')}
              type="date"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          Leave the date blank to just see how many months it'll take at your current pace.
        </p>

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
            {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Add purchase'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
