import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Pencil } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { PayoutBucketsEditor } from '@/components/settings/PayoutBucketsEditor'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessProfile, useSaveBusinessProfile } from '@/hooks/useBusinessProfile'
import { PROVINCE_LABELS } from '@/lib/canadianTax'
import type { ProvinceCode } from '@/lib/canadianTax'
import { cn } from '@/lib/utils'

const settingsSchema = z.object({
  business_name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  province: z.string().optional(),
  gst_registered: z.boolean().optional(),
  gst_rate: z.coerce.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less').optional(),
  tuition_credit_remaining: z.coerce.number().min(0, 'Must be 0 or more').optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

function DetailField({
  label,
  value,
  className,
  multiline,
}: {
  label: string
  value?: string | null
  className?: string
  multiline?: boolean
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={cn('text-sm', multiline && 'whitespace-pre-wrap', value ? 'text-gray-900' : 'text-gray-400 italic')}>
        {value || 'Not set'}
      </p>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useBusinessProfile()
  const saveProfile = useSaveBusinessProfile()
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormValues>,
    defaultValues: {
      business_name: '',
      address: '',
      phone: '',
      email: '',
      province: '',
      gst_registered: false,
      gst_rate: '' as unknown as number,
      tuition_credit_remaining: '' as unknown as number,
    },
  })

  const gstRegistered = useWatch({ control, name: 'gst_registered' })

  function resetFromProfile() {
    reset({
      business_name: profile?.business_name ?? '',
      address: profile?.address ?? '',
      phone: profile?.phone ?? '',
      email: profile?.email ?? '',
      province: profile?.province ?? '',
      gst_registered: profile?.gst_registered ?? false,
      gst_rate: profile?.gst_rate ?? ('' as unknown as number),
      tuition_credit_remaining: profile?.tuition_credit_remaining ?? ('' as unknown as number),
    })
  }

  useEffect(() => {
    if (!isLoading) resetFromProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, profile])

  async function onSubmit(values: SettingsFormValues) {
    setSaved(false)
    await saveProfile.mutateAsync({
      user_id: user!.id,
      business_name: values.business_name || null,
      address: values.address || null,
      phone: values.phone || null,
      email: values.email || null,
      province: values.province || null,
      gst_registered: values.gst_registered ?? false,
      gst_rate: values.gst_registered ? (values.gst_rate ?? null) : null,
      tuition_credit_remaining: values.tuition_credit_remaining ?? null,
      onboarding_completed: true,
    })
    setSaved(true)
    setEditing(false)
  }

  function handleCancel() {
    resetFromProfile()
    setEditing(false)
  }

  const gstSummary = profile?.gst_registered
    ? `Registered${profile.gst_rate != null ? ` · ${profile.gst_rate}% default rate` : ''}`
    : 'Not registered'
  const tuitionSummary =
    profile?.tuition_credit_remaining != null && profile.tuition_credit_remaining > 0
      ? `$${profile.tuition_credit_remaining.toLocaleString()} remaining`
      : null

  return (
    <AppLayout title="Settings" subtitle="Your business info and payout buckets" showPeriodSelector={false}>
      <div className="max-w-2xl flex flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Business Info</h2>
                <p className="text-xs text-gray-400">Appears at the top of every invoice PDF you generate.</p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 transition shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!editing ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
                >
                  <DetailField label="Business / Your Name" value={profile?.business_name} />
                  <DetailField label="Phone" value={profile?.phone} />
                  <DetailField label="Email" value={profile?.email} />
                  <DetailField
                    label="Province"
                    value={profile?.province ? PROVINCE_LABELS[profile.province as ProvinceCode] : null}
                  />
                  <DetailField label="Address" value={profile?.address} multiline className="sm:col-span-2" />
                  <DetailField label="GST/HST" value={gstSummary} />
                  <DetailField label="Federal Tuition Credit" value={tuitionSummary} />
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business / Your Name</label>
                    <input
                      {...register('business_name')}
                      placeholder="Marie Angelika Maglinte"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <textarea
                      {...register('address')}
                      rows={2}
                      placeholder="1405 - 615 6 AVE SE, Calgary, AB, T2G 1S2"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input
                        {...register('phone')}
                        placeholder="587 703 4351"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
                    <select
                      {...register('province')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select province</option>
                      {(Object.keys(PROVINCE_LABELS) as ProvinceCode[]).map((code) => (
                        <option key={code} value={code}>{PROVINCE_LABELS[code]}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-400">Used for provincial income tax on the Tax tab.</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 w-fit cursor-pointer">
                      <input
                        {...register('gst_registered')}
                        type="checkbox"
                        className="w-4 h-4 accent-primary-600 cursor-pointer"
                      />
                      I'm registered for GST/HST
                    </label>
                    {gstRegistered && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          {...register('gst_rate')}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="e.g. 5"
                          className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-500">% default rate for new invoices</span>
                      </div>
                    )}
                    {errors.gst_rate && <p className="mt-1 text-xs text-red-600">{errors.gst_rate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Federal Tuition Credit Remaining ($)</label>
                    <input
                      {...register('tuition_credit_remaining')}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 31361"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      From "unused federal tuition, education, and textbook amounts" on your latest Notice of Assessment.
                      Update this once a year — the Tax tab doesn't track usage automatically.
                    </p>
                    {errors.tuition_credit_remaining && <p className="mt-1 text-xs text-red-600">{errors.tuition_credit_remaining.message}</p>}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <PrimaryButton type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-medium">
                      {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {saved && !editing && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-sm text-[#548164] mt-4"
              >
                <Check className="w-4 h-4" /> Saved
              </motion.span>
            )}
          </div>
        </form>

        <PayoutBucketsEditor defaultTaxRate={profile?.tax_rate ?? 20} defaultSavingsRate={profile?.savings_rate ?? 10} />
      </div>
    </AppLayout>
  )
}
