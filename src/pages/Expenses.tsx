import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, Search, Pencil, Trash2, Download, LayoutList, Briefcase, User } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { CategoryBadge } from '@/components/expenses/CategoryBadge'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import type { ExpenseFormValues } from '@/components/expenses/ExpenseForm'
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses'
import { exportExpenses } from '@/lib/export'
import { EXPENSE_CATEGORIES, EXPENSE_TYPE_COLORS } from '@/types'
import type { Expense } from '@/types'
import { cn } from '@/lib/utils'

type TabType = 'all' | 'business' | 'personal'

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Expenses', icon: <LayoutList className="w-4 h-4" /> },
  { id: 'business', label: 'Business', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
]

export default function Expenses() {
  const { data: expenses = [], isLoading } = useExpenses()
  const addExpense = useAddExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const tabCounts = useMemo(() => ({
    all: expenses.length,
    business: expenses.filter((e) => e.type === 'business').length,
    personal: expenses.filter((e) => e.type === 'personal').length,
  }), [expenses])

  const tabTotals = useMemo(() => ({
    all: expenses.reduce((s, e) => s + e.amount, 0),
    business: expenses.filter((e) => e.type === 'business').reduce((s, e) => s + e.amount, 0),
    personal: expenses.filter((e) => e.type === 'personal').reduce((s, e) => s + e.amount, 0),
  }), [expenses])

  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      const matchTab = activeTab === 'all' || exp.type === activeTab
      const matchSearch =
        exp.title.toLowerCase().includes(search.toLowerCase()) ||
        (exp.vendor?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchCat = categoryFilter ? exp.category === categoryFilter : true
      return matchTab && matchSearch && matchCat
    })
  }, [expenses, activeTab, search, categoryFilter])

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0)

  async function handleSubmit(values: ExpenseFormValues) {
    if (editTarget) {
      await updateExpense.mutateAsync({ id: editTarget.id, ...values })
    } else {
      await addExpense.mutateAsync(values)
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(exp: Expense) {
    setEditTarget(exp)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteExpense.mutateAsync(id)
    setDeleteId(null)
  }

  function handleExport() {
    const label = activeTab === 'all' ? 'All' : activeTab === 'business' ? 'Business' : 'Personal'
    exportExpenses(filtered, label)
  }

  return (
    <AppLayout
      title="Expenses"
      subtitle="Track and manage your expenses"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      }
    >
      {/* Summary cards / tabs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'text-left p-4 rounded-2xl border transition-all',
              activeTab === tab.id
                ? 'bg-white border-purple-200 shadow-[0_1px_3px_rgba(0,0,0,0.07)] ring-1 ring-purple-200'
                : 'bg-white border-gray-100 hover:border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
            )}
          >
            <div className={cn(
              'flex items-center gap-2 text-sm font-medium mb-2',
              activeTab === tab.id ? 'text-purple-700' : 'text-gray-500'
            )}>
              {tab.icon}
              {tab.label}
            </div>
            <p className="text-xl font-bold text-gray-900">
              ${tabTotals[tab.id].toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{tabCounts[tab.id]} transactions</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {filtered.length > 0 && (search || categoryFilter) && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 shrink-0">
            <span className="text-gray-400">Total:</span>
            <span className="font-semibold text-gray-900">
              ${totalFiltered.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {search || categoryFilter ? 'No expenses match your filters' : `No ${activeTab === 'all' ? '' : activeTab + ' '}expenses yet`}
            </p>
            {!search && !categoryFilter && (
              <button
                onClick={() => { setEditTarget(null); setFormOpen(true) }}
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                Add expense
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Title</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Category</th>
                {activeTab === 'all' && (
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Type</th>
                )}
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Amount</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {format(new Date(exp.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{exp.title}</p>
                    {exp.notes && <p className="text-xs text-gray-400 truncate max-w-[180px]">{exp.notes}</p>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {exp.vendor ?? '—'}
                  </td>
                  <td className="px-4 py-4">
                    <CategoryBadge category={exp.category} />
                  </td>
                  {activeTab === 'all' && (
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        EXPENSE_TYPE_COLORS[exp.type as 'business' | 'personal'] ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {exp.type === 'business' ? 'Business' : 'Personal'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(exp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(exp.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit form modal */}
      <ExpenseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Delete expense?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
