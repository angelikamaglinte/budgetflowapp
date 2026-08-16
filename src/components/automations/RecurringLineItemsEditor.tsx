import { useFieldArray } from 'react-hook-form'
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type { RecurringInvoiceFormValues } from './RecurringInvoiceForm'

interface RecurringLineItemsEditorProps {
  control: Control<RecurringInvoiceFormValues>
  register: UseFormRegister<RecurringInvoiceFormValues>
  errors: FieldErrors<RecurringInvoiceFormValues>
}

export function RecurringLineItemsEditor({ control, register, errors }: RecurringLineItemsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-xl">
          <div className="col-span-12 sm:col-span-7">
            <textarea
              {...register(`line_items.${index}.description`)}
              rows={2}
              placeholder="Description"
              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.line_items?.[index]?.description && (
              <p className="mt-1 text-xs text-red-600">{errors.line_items[index]?.description?.message}</p>
            )}
          </div>
          <div className="col-span-5 sm:col-span-2">
            <input
              {...register(`line_items.${index}.qty`)}
              type="number"
              step="0.5"
              placeholder="Qty"
              className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-6 sm:col-span-2">
            <input
              {...register(`line_items.${index}.rate`)}
              type="number"
              step="0.01"
              placeholder="Rate"
              className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-1 flex items-start justify-end">
            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {typeof errors.line_items?.message === 'string' && (
        <p className="text-xs text-red-600">{errors.line_items.message}</p>
      )}
      <button
        type="button"
        onClick={() => append({ description: '', qty: 1, rate: 0 })}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition"
      >
        <Plus className="w-4 h-4" /> Add line item
      </button>
    </div>
  )
}
