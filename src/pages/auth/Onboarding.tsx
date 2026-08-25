import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSaveBusinessProfile } from '@/hooks/useBusinessProfile'
import { useAddBucket } from '@/hooks/usePayoutBuckets'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { PROVINCE_LABELS } from '@/lib/canadianTax'
import type { ProvinceCode } from '@/lib/canadianTax'

const onboardingSchema = z.object({
  business_name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  province: z.string().optional(),
  tax_rate: z.coerce.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
  savings_rate: z.coerce.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

const STEPS = ['Business Info', 'Allocation Rates'] as const

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const saveProfile = useSaveBusinessProfile()
  const addBucket = useAddBucket()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingValues>,
    defaultValues: { business_name: '', address: '', phone: '', email: '', province: '', tax_rate: 20, savings_rate: 10 },
  })

  async function persist(values: OnboardingValues) {
    setSaving(true)
    try {
      await saveProfile.mutateAsync({
        user_id: user!.id,
        business_name: values.business_name || null,
        address: values.address || null,
        phone: values.phone || null,
        email: values.email || null,
        province: values.province || null,
        tax_rate: values.tax_rate,
        savings_rate: values.savings_rate,
        onboarding_completed: true,
      })
      // Seeds a working payout split so new users land on the Dashboard
      // with something already set up — full editing lives in Settings.
      await addBucket.mutateAsync({ name: 'Tax Reserve', percentage: values.tax_rate, sort_order: 0 })
      await addBucket.mutateAsync({ name: 'Savings', percentage: values.savings_rate, sort_order: 1 })
      await addBucket.mutateAsync({ name: 'Owner Pay', percentage: null, sort_order: 2 })
      void navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    void persist(getValues())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">BudgetFlow</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              Step {step + 1} of {STEPS.length}
            </p>
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-xs text-gray-400 hover:text-gray-600 transition disabled:opacity-60"
            >
              Skip for now
            </button>
          </div>
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary-600' : 'bg-gray-100'}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-900 mb-1">Tell us about your business</h1>
                <p className="text-sm text-gray-500 mb-6">
                  This appears at the top of your invoice PDFs. You can change it anytime in Settings.
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business / Your Name</label>
                    <input
                      {...register('business_name')}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <textarea
                      {...register('address')}
                      rows={2}
                      placeholder="Street, City, Province/State, Postal Code"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input
                        {...register('phone')}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
                    <select
                      {...register('province')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select province</option>
                      {(Object.keys(PROVINCE_LABELS) as ProvinceCode[]).map((code) => (
                        <option key={code} value={code}>{PROVINCE_LABELS[code]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <PrimaryButton
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2.5 font-medium rounded-xl text-sm mt-6"
                >
                  Continue
                </PrimaryButton>
              </motion.div>
            ) : (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-900 mb-1">Set your allocation rates</h1>
                <p className="text-sm text-gray-500 mb-6">
                  How much of each payment should be set aside for taxes and savings? You can change this anytime.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Tax Reserve</p>
                      <p className="text-xs text-gray-400">Set aside for tax season</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        {...register('tax_rate')}
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  {errors.tax_rate && <p className="text-xs text-red-600 -mt-2">{errors.tax_rate.message}</p>}
                  <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Personal Savings</p>
                      <p className="text-xs text-gray-400">Set aside for yourself</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        {...register('savings_rate')}
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  {errors.savings_rate && <p className="text-xs text-red-600 -mt-2">{errors.savings_rate.message}</p>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <PrimaryButton
                    type="button"
                    onClick={handleSubmit(persist)}
                    disabled={saving}
                    className="flex-1 py-2.5 font-medium rounded-xl text-sm"
                  >
                    {saving ? 'Saving...' : 'Finish'}
                  </PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
