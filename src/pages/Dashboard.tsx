import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart'
import { RecentInvoices } from '@/components/dashboard/RecentInvoices'
import { InvoiceReminderBanners } from '@/components/dashboard/InvoiceReminderBanners'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { useInvoiceReminders, useDismissInvoiceReminder } from '@/hooks/useInvoiceReminders'
import { usePayoutBuckets } from '@/hooks/usePayoutBuckets'
import { usePeriod, matchesPeriod, periodLabel } from '@/contexts/PeriodContext'
import { getDueReminders } from '@/lib/reminders'
import { computeBucketSplit, getBucketStyle } from '@/lib/payoutBuckets'
import { backOutTax } from '@/lib/canadianTax'

function preTaxAmount(amount: number, taxRate: number | null): number {
  return taxRate ? backOutTax(amount, taxRate).subtotal : amount
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: reminders = [] } = useInvoiceReminders()
  const { data: buckets = [] } = usePayoutBuckets()
  const dismissReminder = useDismissInvoiceReminder()
  const { periodFilter } = usePeriod()

  const dueReminders = useMemo(() => getDueReminders(reminders), [reminders])

  const stats = useMemo(() => {
    const filteredExp = expenses.filter((e) => matchesPeriod(e.date, periodFilter))
    const filteredInv = invoices.filter((inv) => matchesPeriod(inv.date_paid ?? inv.issue_date, periodFilter))

    const totalExpenses = filteredExp.reduce((sum, e) => sum + e.amount, 0)
    // GST/HST collected isn't real income — it's held for the CRA — so it's
    // backed out here the same way Budgets and the Tax tab already do.
    const totalIncome = filteredInv
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + preTaxAmount(inv.amount, inv.tax_rate), 0)
    const pending = invoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + preTaxAmount(inv.amount, inv.tax_rate), 0)
    const netProfit = totalIncome - totalExpenses

    return { totalExpenses, totalIncome, pending, netProfit }
  }, [expenses, invoices, periodFilter])

  const bucketSplit = useMemo(() => computeBucketSplit(stats.totalIncome, buckets), [stats.totalIncome, buckets])

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
      <InvoiceReminderBanners
        dueReminders={dueReminders}
        onCreateInvoice={(clientName) => navigate('/invoices', { state: { prefillClientName: clientName } })}
        onDismiss={(id) => void dismissReminder.mutateAsync(id)}
      />

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
        {bucketSplit.map(({ bucket, amount }, i) => {
          const style = getBucketStyle(i)
          const Icon = style.icon
          return (
            <StatCard
              key={bucket.id}
              label={bucket.percentage != null ? `${bucket.name} (${bucket.percentage}%)` : bucket.name}
              value={amount}
              delay={0.2 + i * 0.05}
              glow={i === 0}
              icon={<Icon className={`w-5 h-5 ${style.iconColor}`} />}
              iconBg={style.iconBg}
            />
          )
        })}
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
