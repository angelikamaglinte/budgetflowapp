import { useState } from 'react'
import type { ReactNode } from 'react'
import { format, subMonths } from 'date-fns'
import { CalendarDays, ChevronDown, Menu, TrendingUp } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { usePeriod } from '@/contexts/PeriodContext'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  showPeriodSelector?: boolean
}

const now = new Date()
const currentYear = now.getFullYear()

const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({
  value: String(y),
  label: String(y),
}))

const monthOptions = Array.from({ length: 24 }, (_, i) => {
  const d = subMonths(now, i)
  return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
})

function periodLabel(value: string): string {
  if (!value) return 'All time'
  return yearOptions.find((y) => y.value === value)?.label
    ?? monthOptions.find((m) => m.value === value)?.label
    ?? 'All time'
}

export function AppLayout({ children, title, subtitle, action, showPeriodSelector = true }: AppLayoutProps) {
  const { periodFilter, setPeriodFilter } = usePeriod()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">BudgetFlow</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <NotificationBell />

            {/* Global period selector */}
            {showPeriodSelector && (
              <DropdownMenu onOpenChange={setPeriodMenuOpen}>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 transition shrink-0"
                    />
                  }
                >
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  {periodLabel(periodFilter)}
                  <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', periodMenuOpen && 'rotate-180')} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-96 w-52">
                  <DropdownMenuRadioGroup value={periodFilter} onValueChange={(v) => setPeriodFilter(String(v ?? ''))}>
                    <DropdownMenuRadioItem
                      value=""
                      render={<button type="button" className="flex w-full cursor-pointer items-center" />}
                    >
                      All time
                    </DropdownMenuRadioItem>
                    <DropdownMenuLabel>Year</DropdownMenuLabel>
                    {yearOptions.map((y) => (
                      <DropdownMenuRadioItem
                        key={y.value}
                        value={y.value}
                        render={<button type="button" className="flex w-full cursor-pointer items-center" />}
                      >
                        {y.label}
                      </DropdownMenuRadioItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Month</DropdownMenuLabel>
                    {monthOptions.map((m) => (
                      <DropdownMenuRadioItem
                        key={m.value}
                        value={m.value}
                        render={<button type="button" className="flex w-full cursor-pointer items-center" />}
                      >
                        {m.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
