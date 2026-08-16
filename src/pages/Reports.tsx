import { BarChart3 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { InvoiceAgingSection } from '@/components/reports/InvoiceAgingSection'
import { ClientIncomeSection } from '@/components/reports/ClientIncomeSection'
import { CashFlowSection } from '@/components/reports/CashFlowSection'
import { QuarterlyTaxSection } from '@/components/reports/QuarterlyTaxSection'
import { ProfitLossSection } from '@/components/reports/ProfitLossSection'
import { CategorySpendingTrendSection } from '@/components/reports/CategorySpendingTrendSection'
import { UpcomingRevenueSection } from '@/components/reports/UpcomingRevenueSection'
import { YearOverYearSection } from '@/components/reports/YearOverYearSection'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { useRecurringInvoices } from '@/hooks/useRecurringInvoices'
import { useAllocation } from '@/contexts/AllocationContext'

export default function Reports() {
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: recurringInvoices = [] } = useRecurringInvoices()
  const { taxRate } = useAllocation()
  const isLoading = loadingExp || loadingInv

  if (isLoading) {
    return (
      <AppLayout title="Reports" subtitle="Aging, client trends, and cash flow at a glance" showPeriodSelector={false}>
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-40 animate-pulse" />
          ))}
        </div>
      </AppLayout>
    )
  }

  if (invoices.length === 0 && expenses.length === 0) {
    return (
      <AppLayout title="Reports" subtitle="Aging, client trends, and cash flow at a glance" showPeriodSelector={false}>
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-gray-500 text-sm">Add invoices and expenses to unlock reports</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Reports" subtitle="Aging, client trends, and cash flow at a glance" showPeriodSelector={false}>
      <div className="flex flex-col gap-8">
        <InvoiceAgingSection invoices={invoices} />
        <ClientIncomeSection invoices={invoices} />
        <CashFlowSection invoices={invoices} expenses={expenses} />
        <QuarterlyTaxSection invoices={invoices} expenses={expenses} taxRate={taxRate} />
        <ProfitLossSection invoices={invoices} expenses={expenses} />
        <CategorySpendingTrendSection expenses={expenses} />
        <UpcomingRevenueSection invoices={invoices} recurringInvoices={recurringInvoices} />
        <YearOverYearSection invoices={invoices} expenses={expenses} />
      </div>
    </AppLayout>
  )
}
