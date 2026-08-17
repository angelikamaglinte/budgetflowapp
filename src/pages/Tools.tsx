import { useParams, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { SchedulerSection } from '@/components/scheduler/SchedulerSection'
import { InvoiceBuilderSection } from '@/components/invoiceBuilder/InvoiceBuilderSection'
import { RecurringExpensesSection } from '@/components/automations/RecurringExpensesSection'
import { RecurringInvoicesSection } from '@/components/automations/RecurringInvoicesSection'

const TAB_LABELS: Record<string, string> = {
  scheduler: 'Scheduler',
  'invoice-builder': 'Invoice Builder',
  'recurring-expenses': 'Recurring Expenses',
  'recurring-invoices': 'Recurring Invoices',
}

export default function Tools() {
  const { tab } = useParams<{ tab: string }>()

  if (!tab || !(tab in TAB_LABELS)) {
    return <Navigate to="/tools/scheduler" replace />
  }

  return (
    <AppLayout title={TAB_LABELS[tab]} subtitle="Utilities to help you run the business" showPeriodSelector={false}>
      {tab === 'scheduler' && <SchedulerSection />}
      {tab === 'invoice-builder' && <InvoiceBuilderSection />}
      {tab === 'recurring-expenses' && <RecurringExpensesSection />}
      {tab === 'recurring-invoices' && <RecurringInvoicesSection />}
    </AppLayout>
  )
}
