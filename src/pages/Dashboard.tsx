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
          value={stats.totalIncome}
          delay={0}
          icon={<TrendingUp className="w-5 h-5 text-[#548164]" />}
          iconBg="bg-[#EEF3ED]"
        />
        <StatCard
          label="Total Expenses"
          value={stats.totalExpenses}
          delay={0.05}
          icon={<TrendingDown className="w-5 h-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Net Profit"
          value={stats.netProfit}
          delay={0.1}
          icon={<DollarSign className="w-5 h-5 text-primary-600" />}
          iconBg="bg-primary-50"
        />
        <StatCard
          label="Pending Invoices"
          value={stats.pending}
          delay={0.15}
          icon={<Clock className="w-5 h-5 text-[#C29343]" />}
          iconBg="bg-[#FAF3DD]"
        />
        <StatCard
          label={`Tax Reserve (${taxRate}%)`}
          value={stats.taxReserve}
          delay={0.2}
          glow
          icon={<ShieldCheck className="w-5 h-5 text-primary-600" />}
          iconBg="bg-accent-100"
        />
        <StatCard
          label={`Savings (${savingsRate}%)`}
          value={stats.savings}
          delay={0.25}
          icon={<PiggyBank className="w-5 h-5 text-[#487CA5]" />}
          iconBg="bg-[#E9F3F7]"
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
