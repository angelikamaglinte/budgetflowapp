import { useMemo, useState } from 'react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Target } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import type { BudgetFormValues } from '@/components/budgets/BudgetForm'
import { useAuth } from '@/contexts/AuthContext'
import { useBudgets, useAddBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayoutBuckets } from '@/hooks/usePayoutBuckets'
import { computeBudgetActual } from '@/lib/budgets'
import type { BudgetCategory } from '@/types'

export default function Budgets() {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets()
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: buckets = [] } = usePayoutBuckets()

  const addBudget = useAddBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BudgetCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const actuals = useMemo(() => {
    const map = new Map<string, number>()
    for (const budget of budgets) {
      map.set(budget.id, computeBudgetActual(budget, expenses, invoices, buckets, month))
    }
    return map
  }, [budgets, expenses, invoices, buckets, month])

  async function handleSubmit(values: BudgetFormValues) {
    const payload = {
      name: values.name,
      monthly_target: values.monthly_target,
      source_type: values.source_type,
      expense_category: values.source_type === 'expense' ? values.expense_category ?? null : null,
      bucket_id: values.source_type === 'bucket' ? values.bucket_id ?? null : null,
    }
    if (editTarget) {
      await updateBudget.mutateAsync({ id: editTarget.id, name: payload.name, monthly_target: payload.monthly_target })
    } else {
      await addBudget.mutateAsync({ ...payload, sort_order: budgets.length, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  async function handleDelete(id: string) {
    await deleteBudget.mutateAsync(id)
    setDeleteId(null)
  }

  const isLoading = loadingBudgets || loadingExp || loadingInv

  return (
    <AppLayout title="Budgets" subtitle="Set a monthly spending limit for any category and track it live" showPeriodSelector={false}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 w-32 text-center">{format(month, 'MMMM yyyy')}</span>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Add Budget Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-gray-500 text-sm">No budget categories yet</p>
          <button
            onClick={() => setFormOpen(true)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
          >
            Add your first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget, i) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              actual={actuals.get(budget.id) ?? 0}
              delay={i * 0.05}
              onEdit={() => { setEditTarget(budget); setFormOpen(true) }}
              onDelete={() => setDeleteId(budget.id)}
            />
          ))}
        </div>
      )}

      <BudgetForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
        buckets={buckets}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete budget category?</h3>
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
