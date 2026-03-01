import type { ReactNode } from 'react'
import { format, subMonths } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { usePeriod } from '@/contexts/PeriodContext'

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
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

export function AppLayout({ children, title, subtitle, action }: AppLayoutProps) {
  const { periodFilter, setPeriodFilter } = usePeriod()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          {/* Global period selector */}
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All time</option>
              <optgroup label="Year">
                {yearOptions.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </optgroup>
              <optgroup label="Month">
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
