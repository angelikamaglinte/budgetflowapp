import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { DayOfMonthPicker } from '@/components/scheduler/DayOfMonthPicker'
import { RecurringLineItemsEditor } from './RecurringLineItemsEditor'
import type { RecurringInvoice } from '@/types'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  qty: z.coerce.number().positive('Qty must be greater than 0'),
  rate: z.coerce.number().min(0, 'Rate must be 0 or more'),
})

const recurringInvoiceSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_company: z.string().optional(),
  client_address: z.string().optional(),
  terms: z.string().optional(),
  tax_rate: z.coerce.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
  thank_you_note: z.string().optional(),
  invoice_number_prefix: z.string().min(1, 'Prefix is required'),
  due_in_days: z.coerce.number().int().min(0).optional().or(z.literal('')),
  day_of_month: z.coerce.number().int().min(1, 'Pick a day').max(31, 'Pick a day'),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
})

export type RecurringInvoiceFormValues = z.infer<typeof recurringInvoiceSchema>

interface RecurringInvoiceFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: RecurringInvoiceFormValues) => Promise<void>
  initial?: RecurringInvoice
}

const emptyLineItem = { description: '', qty: 1, rate: 0 }

export function RecurringInvoiceForm({ open, onClose, onSubmit, initial }: RecurringInvoiceFormProps) {
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } =
    useForm<RecurringInvoiceFormValues>({
      resolver: zodResolver(recurringInvoiceSchema) as Resolver<RecurringInvoiceFormValues>,
      defaultValues: {
        client_name: '',
        client_company: '',
        client_address: '',
        terms: '',
        tax_rate: 0,
        thank_you_note: 'Thank you for your business!',
        invoice_number_prefix: 'INV',
        due_in_days: 30,
        day_of_month: '' as unknown as number,
        line_items: [emptyLineItem],
      },
    })

  const watchedDay = useWatch({ control, name: 'day_of_month' })

  useEffect(() => {
    if (open) {
      reset({
        client_name: initial?.client_name ?? '',
        client_company: initial?.client_company ?? '',
        client_address: initial?.client_address ?? '',
        terms: initial?.terms ?? '',
        tax_rate: initial?.tax_rate ?? 0,
        thank_you_note: initial?.thank_you_note ?? 'Thank you for your business!',
        invoice_number_prefix: initial?.invoice_number_prefix ?? 'INV',
        due_in_days: initial?.due_in_days ?? 30,
        day_of_month: initial?.day_of_month ?? ('' as unknown as number),
        line_items: initial?.line_items && initial.line_items.length > 0 ? initial.line_items : [emptyLineItem],
      })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{initial ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
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
          <RecurringLineItemsEditor control={control} register={register} errors={errors} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Number Prefix</label>
            <input
              {...register('invoice_number_prefix')}
              placeholder="INV"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.invoice_number_prefix && <p className="mt-1 text-xs text-red-600">{errors.invoice_number_prefix.message}</p>}
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms</label>
            <input
              {...register('terms')}
              placeholder="Net 30"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due in (days)</label>
            <input
              {...register('due_in_days')}
              type="number"
              min="0"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Create it on day</label>
          <DayOfMonthPicker
            value={watchedDay || undefined}
            onChange={(day) => setValue('day_of_month', day, { shouldValidate: true })}
          />
          <input type="hidden" {...register('day_of_month')} />
          {errors.day_of_month && <p className="mt-1 text-xs text-red-600">{errors.day_of_month.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Thank You Note (optional)</label>
          <input
            {...register('thank_you_note')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            {isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Add recurring invoice'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
