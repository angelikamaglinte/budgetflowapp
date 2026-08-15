import { useFieldArray, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { DateRangeInline } from './DateRangeInline'
import type { InvoiceBuilderFormValues } from './InvoiceBuilderForm'

interface LineItemsEditorProps {
  control: Control<InvoiceBuilderFormValues>
  register: UseFormRegister<InvoiceBuilderFormValues>
  setValue: UseFormSetValue<InvoiceBuilderFormValues>
  errors: FieldErrors<InvoiceBuilderFormValues>
}

export function LineItemsEditor({ control, register, setValue, errors }: LineItemsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })
  const watchedItems = useWatch({ control, name: 'line_items' })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-12 gap-2">
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
            <div className="col-span-4 sm:col-span-2">
              <input
                {...register(`line_items.${index}.qty`)}
                type="number"
                step="0.5"
                placeholder="Qty"
                className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <input
                {...register(`line_items.${index}.rate`)}
                type="number"
                step="0.01"
                placeholder="Rate"
                className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex items-start justify-end">
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <DateRangeInline
            dateStart={watchedItems?.[index]?.date_start ?? null}
            dateEnd={watchedItems?.[index]?.date_end ?? null}
            onChange={(dateStart, dateEnd) => {
              setValue(`line_items.${index}.date_start`, dateStart, { shouldValidate: true })
              setValue(`line_items.${index}.date_end`, dateEnd, { shouldValidate: true })
            }}
          />
          <input type="hidden" {...register(`line_items.${index}.date_start`)} />
          <input type="hidden" {...register(`line_items.${index}.date_end`)} />
        </div>
      ))}
      {typeof errors.line_items?.message === 'string' && (
        <p className="text-xs text-red-600">{errors.line_items.message}</p>
      )}
      <button
        type="button"
        onClick={() => append({ description: '', date_start: null, date_end: null, qty: 1, rate: 0 })}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition"
      >
        <Plus className="w-4 h-4" /> Add line item
      </button>
    </div>
  )
}
