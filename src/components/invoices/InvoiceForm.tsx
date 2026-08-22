import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Invoice } from '@/types'
import { Modal } from '@/components/ui/Modal'

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  amount: z.coerce.number().positive('Amount must be positive'),
  status: z.enum(['pending', 'paid', 'overdue']),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().optional().transform(v => v === '' ? undefined : v),
  date_paid: z.string().optional().transform(v => v === '' ? undefined : v),
  notes: z.string().optional(),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: InvoiceFormValues) => Promise<void>
  initial?: Invoice
  defaultClientName?: string
  nextInvoiceNumber?: string
}

export function InvoiceForm({ open, onClose, onSubmit, initial, defaultClientName, nextInvoiceNumber }: InvoiceFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as Resolver<InvoiceFormValues>,
    defaultValues: {
      invoice_number: '',
      client_name: defaultClientName ?? '',
      client_email: '',
      amount: '' as unknown as number,
      status: 'pending',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      date_paid: '',
      notes: '',
    },
  })

  const watchedStatus = useWatch({ control, name: 'status' })

  useEffect(() => {
    if (open) {
      reset({
        invoice_number: initial?.invoice_number ?? nextInvoiceNumber ?? '',
        client_name: initial?.client_name ?? defaultClientName ?? '',
        client_email: initial?.client_email ?? '',
        amount: initial?.amount ?? ('' as unknown as number),
        status: (initial?.status as 'pending' | 'paid' | 'overdue') ?? 'pending',
        issue_date: initial?.issue_date ?? new Date().toISOString().split('T')[0],
        due_date: initial?.due_date ?? '',
        date_paid: initial?.date_paid ?? '',
        notes: initial?.notes ?? '',
      })
    }
  }, [open, initial, defaultClientName, nextInvoiceNumber, reset])

  return (
    <Modal open={open} onClose={onClose}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{initial ? 'Edit Invoice' : 'New Invoice'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice #</label>
              <Controller
                control={control}
                name="invoice_number"
                render={({ field }) => (
                  <div className="flex items-stretch rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                    <span className="flex items-center px-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 select-none">
                      INV-
                    </span>
                    <input
                      value={field.value.replace(/^inv-?/i, '')}
                      onChange={(e) => field.onChange(e.target.value ? `INV-${e.target.value}` : '')}
                      onBlur={field.onBlur}
                      placeholder="001"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                )}
              />
              {errors.invoice_number && <p className="mt-1 text-xs text-red-600">{errors.invoice_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
            <input
              {...register('client_name')}
              placeholder="Acme Corp"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.client_name && <p className="mt-1 text-xs text-red-600">{errors.client_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email (optional)</label>
            <input
              {...register('client_email')}
              type="email"
              placeholder="client@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.client_email && <p className="mt-1 text-xs text-red-600">{errors.client_email.message}</p>}
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
              <input
                {...register('issue_date')}
                type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.issue_date && <p className="mt-1 text-xs text-red-600">{errors.issue_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date (optional)</label>
              <input
                {...register('due_date')}
                type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {watchedStatus === 'paid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Paid</label>
              <input
                {...register('date_paid')}
                type="date"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DCE9DA] bg-[#EEF3ED] text-sm focus:outline-none focus:ring-2 focus:ring-[#548164] focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">The date you actually received the money</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Project details, payment terms..."
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
              {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create invoice'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
