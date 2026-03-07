import { useMemo } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Clock, PiggyBank, ShieldCheck } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { RecentInvoices } from '@/components/dashboard/RecentInvoices'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { usePeriod, matchesPeriod, periodLabel } from '@/contexts/PeriodContext'
import { useAllocation } from '@/contexts/AllocationContext'

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard() {
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { periodFilter } = usePeriod()
  const { taxRate, savingsRate } = useAllocation()

  const stats = useMemo(() => {
    const filteredExp = expenses.filter((e) => matchesPeriod(e.date, periodFilter))
    const filteredInv = invoices.filter((inv) => matchesPeriod(inv.date_paid ?? inv.issue_date, periodFilter))

    const totalExpenses = filteredExp.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = filteredInv
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
    const pending = invoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0)
    const netProfit = totalIncome - totalExpenses
    const taxReserve = totalIncome * (taxRate / 100)
    const savings = totalIncome * (savingsRate / 100)

    return { totalExpenses, totalIncome, pending, netProfit, taxReserve, savings }
  }, [expenses, invoices, periodFilter, taxRate, savingsRate])

  const subtitle = periodFilter
    ? `Financial overview for ${periodLabel(periodFilter)}`
    : 'Financial overview for all time'

  const isLoading = loadingExp || loadingInv

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" subtitle="Your financial overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Dashboard" subtitle={subtitle}>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Income"
          value={formatMoney(stats.totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-teal-600" />}
          iconBg="bg-teal-50"
        />
        <StatCard
          label="Total Expenses"
          value={formatMoney(stats.totalExpenses)}
          icon={<TrendingDown className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Net Profit"
          value={formatMoney(stats.netProfit)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Pending Invoices"
          value={formatMoney(stats.pending)}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label={`Tax Reserve (${taxRate}%)`}
          value={formatMoney(stats.taxReserve)}
          icon={<ShieldCheck className="w-5 h-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        <StatCard
          label={`Savings (${savingsRate}%)`}
          value={formatMoney(stats.savings)}
          icon={<PiggyBank className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <SpendingChart expenses={expenses} />
        </div>
        <CategoryChart expenses={expenses} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncomeExpenseChart expenses={expenses} invoices={invoices} />
        <RecentInvoices invoices={invoices} />
      </div>
    </AppLayout>
  )
}
