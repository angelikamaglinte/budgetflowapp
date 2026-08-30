import { useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { Plus, Trash2, AlertCircle, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { useAuth } from '@/contexts/AuthContext'
import { usePayoutBuckets, useAddBucket, useUpdateBucket, useDeleteBucket } from '@/hooks/usePayoutBuckets'
import { getBucketStyle } from '@/lib/payoutBuckets'

interface BucketRow {
  id?: string
  name: string
  percentage: string
}

interface BucketsFormValues {
  buckets: BucketRow[]
  remainderIndex: number | null
}

function bucketsToFormValues(buckets: { id: string; name: string; percentage: number | null }[]): BucketsFormValues {
  const remainderIndex = buckets.findIndex((b) => b.percentage == null)
  return {
    buckets: buckets.map((b) => ({ id: b.id, name: b.name, percentage: b.percentage == null ? '' : String(b.percentage) })),
    remainderIndex: remainderIndex === -1 ? null : remainderIndex,
  }
}

interface PayoutBucketsEditorProps {
  defaultTaxRate: number
  defaultSavingsRate: number
}

export function PayoutBucketsEditor({ defaultTaxRate, defaultSavingsRate }: PayoutBucketsEditorProps) {
  const { user } = useAuth()
  const { data: buckets = [], isLoading } = usePayoutBuckets()
  const addBucket = useAddBucket()
  const updateBucket = useUpdateBucket()
  const deleteBucket = useDeleteBucket()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const { register, control, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<BucketsFormValues>({
    defaultValues: { buckets: [], remainderIndex: null },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'buckets' })
  const watchedBuckets = useWatch({ control, name: 'buckets' })
  const remainderIndex = useWatch({ control, name: 'remainderIndex' })

  useEffect(() => {
    if (!isLoading) reset(bucketsToFormValues(buckets))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, buckets])

  const fixedTotal = (watchedBuckets ?? []).reduce((sum, row, i) => {
    if (i === remainderIndex) return sum
    const n = Number(row?.percentage)
    return sum + (Number.isFinite(n) ? n : 0)
  }, 0)
  const overBudget = fixedTotal > 100

  async function handleSeed() {
    setSeeding(true)
    setSaveError(null)
    try {
      await addBucket.mutateAsync({ name: 'Tax Reserve', percentage: defaultTaxRate, sort_order: 0, user_id: user!.id })
      await addBucket.mutateAsync({ name: 'Savings', percentage: defaultSavingsRate, sort_order: 1, user_id: user!.id })
      await addBucket.mutateAsync({ name: 'Owner Pay', percentage: null, sort_order: 2, user_id: user!.id })
    } finally {
      setSeeding(false)
    }
  }

  async function onSubmit(values: BucketsFormValues) {
    setSaved(false)
    setSaveError(null)

    if (values.buckets.length === 0) return
    if (values.remainderIndex == null) {
      setSaveError('Mark one bucket as the remainder — it absorbs whatever is left over.')
      return
    }
    if (values.buckets.some((b) => !b.name.trim())) {
      setSaveError('Every bucket needs a name.')
      return
    }
    const total = values.buckets.reduce(
      (sum, row, i) => (i === values.remainderIndex ? sum : sum + (Number(row.percentage) || 0)),
      0
    )
    if (total > 100) {
      setSaveError('Your fixed percentages add up to more than 100% — the remainder bucket would go negative.')
      return
    }

    const existingIds = new Set(buckets.map((b) => b.id))
    const keptIds = new Set(values.buckets.filter((b) => b.id).map((b) => b.id))

    for (const id of existingIds) {
      if (!keptIds.has(id)) await deleteBucket.mutateAsync(id!)
    }

    for (let i = 0; i < values.buckets.length; i++) {
      const row = values.buckets[i]
      const percentage = i === values.remainderIndex ? null : Number(row.percentage) || 0
      if (row.id) {
        await updateBucket.mutateAsync({ id: row.id, name: row.name.trim(), percentage, sort_order: i })
      } else {
        await addBucket.mutateAsync({ name: row.name.trim(), percentage, sort_order: i, user_id: user!.id })
      }
    }

    setSaved(true)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Payout Buckets</h2>
      <p className="text-xs text-gray-400 mb-4">
        Split every invoice payment across your own named buckets instead of a flat Tax/Savings rate. One bucket is
        the "remainder" and absorbs whatever's left over.
      </p>

      {!isLoading && buckets.length === 0 && fields.length === 0 && (
        <button
          type="button"
          onClick={() => void handleSeed()}
          disabled={seeding}
          className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-100 rounded-xl text-sm text-primary-700 font-medium transition disabled:opacity-60 mb-4"
        >
          {seeding
            ? 'Setting up...'
            : `Use my current Tax Reserve (${defaultTaxRate}%) + Savings (${defaultSavingsRate}%)`}
        </button>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        {fields.map((field, i) => {
          const style = getBucketStyle(i)
          const Icon = style.icon
          const isRemainder = remainderIndex === i
          return (
            <div key={field.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
              </div>
              <input
                {...register(`buckets.${i}.name` as const)}
                placeholder="Bucket name"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {isRemainder ? (
                <span className="w-20 text-center px-2 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium shrink-0">
                  Remainder
                </span>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    {...register(`buckets.${i}.percentage` as const)}
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0"
                    className="w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              )}
              <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0 cursor-pointer" title="This bucket gets whatever's left over">
                <input
                  type="radio"
                  checked={isRemainder}
                  onChange={() => setValue('remainderIndex', i)}
                  className="w-3.5 h-3.5 accent-primary-600 cursor-pointer"
                />
                Remainder
              </label>
              <button
                type="button"
                onClick={() => {
                  remove(i)
                  if (remainderIndex === i) setValue('remainderIndex', null)
                  else if (remainderIndex != null && remainderIndex > i) setValue('remainderIndex', remainderIndex - 1)
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => append({ name: '', percentage: '' })}
          className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline w-fit"
        >
          <Plus className="w-3.5 h-3.5" /> Add bucket
        </button>

        {fields.length > 0 && (
          <p className={`text-xs ${overBudget ? 'text-red-600' : 'text-gray-400'}`}>
            {overBudget && <AlertCircle className="w-3 h-3 inline mr-1" />}
            Fixed buckets total {fixedTotal}% of every payout.
          </p>
        )}

        {saveError && (
          <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}</p>
        )}

        {fields.length > 0 && (
          <div className="flex items-center gap-3 pt-1">
            <PrimaryButton type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-medium">
              {isSubmitting ? 'Saving...' : 'Save Buckets'}
            </PrimaryButton>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-sm text-[#548164]"
              >
                <Check className="w-4 h-4" /> Saved
              </motion.span>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
