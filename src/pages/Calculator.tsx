import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Calculator as CalculatorIcon, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { StatCard } from '@/components/dashboard/StatCard'
import { PurchasePlanForm } from '@/components/calculator/PurchasePlanForm'
import type { PurchasePlanFormValues } from '@/components/calculator/PurchasePlanForm'
import { PurchasePlanCard } from '@/components/calculator/PurchasePlanCard'
import {
  usePurchasePlans,
  useAddPurchasePlan,
  useUpdatePurchasePlan,
  useDeletePurchasePlan,
} from '@/hooks/usePurchasePlans'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { useAuth } from '@/contexts/AuthContext'
import { useAllocation } from '@/contexts/AllocationContext'
import { computeMonthlyAverages, formatMoney } from '@/lib/savingsCalculator'
import type { PurchasePlan } from '@/types'

export default function Calculator() {
  const { user } = useAuth()
  const { taxRate, savingsRate } = useAllocation()
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: plans = [], isLoading: loadingPlans } = usePurchasePlans()
  const addPlan = useAddPurchasePlan()
  const updatePlan = useUpdatePurchasePlan()
  const deletePlan = useDeletePurchasePlan()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PurchasePlan | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const averages = useMemo(
    () => computeMonthlyAverages(expenses, invoices),
    [expenses, invoices]
  )
  const avgMonthlyLeftover = averages.avgMonthlyIncome * (1 - (taxRate + savingsRate) / 100) - averages.avgMonthlyExpenses

  async function handleSubmit(values: PurchasePlanFormValues) {
    const payload = { ...values, target_date: values.target_date || null }
    if (editTarget) {
      await updatePlan.mutateAsync({ id: editTarget.id, ...payload })
    } else {
      await addPlan.mutateAsync({ ...payload, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(plan: PurchasePlan) {
    setEditTarget(plan)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deletePlan.mutateAsync(id)
    setDeleteId(null)
  }

  const isLoading = loadingExp || loadingInv || loadingPlans

  return (
    <AppLayout
      title="Savings Calculator"
      subtitle="See how much extra you need to save for something on top of your tax reserve and savings"
      showPeriodSelector={false}
      action={
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Purchase
        </PrimaryButton>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
            <StatCard
              label="Avg Monthly Income"
              value={averages.avgMonthlyIncome}
              format={formatMoney}
              icon={<TrendingUp className="w-5 h-5 text-[#548164]" />}
              iconBg="bg-[#EEF3ED]"
            />
            <StatCard
              label="Avg Monthly Expenses"
              value={averages.avgMonthlyExpenses}
              format={formatMoney}
              delay={0.05}
              icon={<TrendingDown className="w-5 h-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <StatCard
              label={`Leftover after ${taxRate}% tax + ${savingsRate}% savings`}
              value={avgMonthlyLeftover}
              format={formatMoney}
              delay={0.1}
              glow={avgMonthlyLeftover > 0}
              icon={<PiggyBank className="w-5 h-5 text-[#487CA5]" />}
              iconBg="bg-[#E9F3F7]"
            />
          </div>
          <p className="text-xs text-gray-400 mb-6">
            Based on your last {averages.monthsOfDataUsed || 3} months of paid invoices and expenses. Each purchase
            below assumes it gets your full leftover — not split between multiple purchases.
          </p>

          {/* Purchase plans */}
          {plans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <CalculatorIcon className="w-6 h-6 text-primary-400" />
              </div>
              <p className="text-gray-500 text-sm">No purchases yet</p>
              <button
                onClick={() => { setEditTarget(null); setFormOpen(true) }}
                className="text-primary-600 text-sm font-medium hover:underline"
              >
                Plan a purchase
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, i) => (
                <PurchasePlanCard
                  key={plan.id}
                  plan={plan}
                  averages={averages}
                  taxRate={taxRate}
                  savingsRate={savingsRate}
                  delay={Math.min(i, 15) * 0.05}
                  onEdit={() => openEdit(plan)}
                  onDelete={() => setDeleteId(plan.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit form modal */}
      <PurchasePlanForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this purchase?</h3>
          <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && void handleDelete(deleteId)}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
