import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { BusinessProfile } from '@/types'

const businessProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
})

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>

interface BusinessProfileFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: BusinessProfileFormValues) => Promise<void>
  initial?: BusinessProfile | null
}

export function BusinessProfileForm({ open, onClose, onSubmit, initial }: BusinessProfileFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema) as Resolver<BusinessProfileFormValues>,
    defaultValues: { business_name: '', address: '', phone: '', email: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        business_name: initial?.business_name ?? '',
        address: initial?.address ?? '',
        phone: initial?.phone ?? '',
        email: initial?.email ?? '',
      })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Your Business Info</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <p className="text-xs text-gray-400 -mt-1">This appears at the top of every invoice PDF you generate.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business / Your Name</label>
          <input
            {...register('business_name')}
            placeholder="Marie Angelika Maglinte"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.business_name && <p className="mt-1 text-xs text-red-600">{errors.business_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address (optional)</label>
          <textarea
            {...register('address')}
            rows={2}
            placeholder="1405 - 615 6 AVE SE, Calgary, AB, T2G 1S2"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
            <input
              {...register('phone')}
              placeholder="587 703 4351"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (optional)</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
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
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
