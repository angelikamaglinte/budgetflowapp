import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { SchedulerSection } from '@/components/scheduler/SchedulerSection'
import { InvoiceBuilderSection } from '@/components/invoiceBuilder/InvoiceBuilderSection'
import { cn } from '@/lib/utils'

type ToolTab = 'scheduler' | 'invoice-builder'

const TOOL_TABS: { id: ToolTab; label: string }[] = [
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'invoice-builder', label: 'Invoice Builder' },
]

export default function Tools() {
  const [activeTab, setActiveTab] = useState<ToolTab>('scheduler')

  return (
    <AppLayout title="Tools" subtitle="Utilities to help you run the business" showPeriodSelector={false}>
      <div className="flex gap-2 mb-6">
        {TOOL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
              activeTab === tab.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scheduler' && <SchedulerSection />}
      {activeTab === 'invoice-builder' && <InvoiceBuilderSection />}
    </AppLayout>
  )
}
