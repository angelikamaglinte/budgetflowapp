import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { LineItemsEditor } from './LineItemsEditor'
import { computeSubtotal, computeTax, computeTotal, formatMoney } from '@/lib/pdfInvoice'
import type { PdfInvoice } from '@/types'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  date_range: z.string().optional(),
  qty: z.coerce.number().positive('Qty must be greater than 0'),
  rate: z.coerce.number().min(0, 'Rate must be 0 or more'),
})

const invoiceBuilderSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional(),
  terms: z.string().optional(),
  client_name: z.string().min(1, 'Client name is required'),
  client_company: z.string().optional(),
  client_address: z.string().optional(),
  tax_rate: z.coerce.number().min(0, 'Tax rate must be 0 or more').max(100, 'Tax rate must be 100 or less'),
  thank_you_note: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
})

export type InvoiceBuilderFormValues = z.infer<typeof invoiceBuilderSchema>

interface InvoiceBuilderFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: InvoiceBuilderFormValues) => Promise<void>
  initial?: Partial<PdfInvoice>
  isEditing?: boolean
}

const emptyLineItem = { description: '', date_range: '', qty: 1, rate: 0 }

export function InvoiceBuilderForm({ open, onClose, onSubmit, initial, isEditing }: InvoiceBuilderFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<InvoiceBuilderFormValues>({
    resolver: zodResolver(invoiceBuilderSchema) as Resolver<InvoiceBuilderFormValues>,
    defaultValues: {
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      terms: '',
      client_name: '',
      client_company: '',
      client_address: '',
      tax_rate: 0,
      thank_you_note: 'Thank you for your business!',
      line_items: [emptyLineItem],
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        invoice_number: initial?.invoice_number ?? '',
        invoice_date: initial?.invoice_date ?? new Date().toISOString().split('T')[0],
        due_date: initial?.due_date ?? '',
        terms: initial?.terms ?? '',
        client_name: initial?.client_name ?? '',
        client_company: initial?.client_company ?? '',
        client_address: initial?.client_address ?? '',
        tax_rate: initial?.tax_rate ?? 0,
        thank_you_note: initial?.thank_you_note ?? 'Thank you for your business!',
        line_items: initial?.line_items && initial.line_items.length > 0 ? initial.line_items : [emptyLineItem],
      })
    }
  }, [open, initial, reset])

  const watchedItems = useWatch({ control, name: 'line_items' })
  const watchedTaxRate = useWatch({ control, name: 'tax_rate' })
  const subtotal = computeSubtotal(
    (watchedItems ?? []).map((i) => ({ ...i, qty: Number(i.qty) || 0, rate: Number(i.rate) || 0, date_range: i.date_range ?? '' }))
  )
  const tax = computeTax(subtotal, Number(watchedTaxRate) || 0)
  const total = computeTotal(subtotal, tax)

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice #</label>
            <input
              {...register('invoice_number')}
              placeholder="19"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.invoice_number && <p className="mt-1 text-xs text-red-600">{errors.invoice_number.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              {...register('invoice_date')}
              type="date"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.invoice_date && <p className="mt-1 text-xs text-red-600">{errors.invoice_date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms (optional)</label>
            <input
              {...register('terms')}
              placeholder="Net 30"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
            <input
              {...register('client_name')}
              placeholder="Jack Belinski"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.client_name && <p className="mt-1 text-xs text-red-600">{errors.client_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Company (optional)</label>
            <input
              {...register('client_company')}
              placeholder="360 Integration LLC"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Address (optional)</label>
            <input
              {...register('client_address')}
              placeholder="1553 Town Park Dr, Port Orange, FL 32129"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
          <LineItemsEditor control={control} register={register} errors={errors} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Rate (%)</label>
            <input
              {...register('tax_rate')}
              type="number"
              step="0.001"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.tax_rate && <p className="mt-1 text-xs text-red-600">{errors.tax_rate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thank You Note (optional)</label>
            <input
              {...register('thank_you_note')}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between w-full max-w-[200px] text-sm text-gray-500">
            <span>Subtotal</span><span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between w-full max-w-[200px] text-sm text-gray-500">
            <span>Tax</span><span>{formatMoney(tax)}</span>
          </div>
          <div className="flex justify-between w-full max-w-[200px] text-base font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
            <span>Total</span><span>{formatMoney(total)}</span>
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
            {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Save invoice'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
