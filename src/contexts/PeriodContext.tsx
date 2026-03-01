import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface PeriodContextValue {
  periodFilter: string
  setPeriodFilter: (v: string) => void
}

const PeriodContext = createContext<PeriodContextValue>({
  periodFilter: '',
  setPeriodFilter: () => {},
})

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periodFilter, setPeriodFilter] = useState('')
  return (
    <PeriodContext.Provider value={{ periodFilter, setPeriodFilter }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  return useContext(PeriodContext)
}

// Returns true if a date string (YYYY-MM-DD or YYYY-MM-DDTHH:...) matches the filter.
// filter '' = all time, 'YYYY' = year, 'YYYY-MM' = month
export function matchesPeriod(dateStr: string, filter: string): boolean {
  if (!filter) return true
  return dateStr.startsWith(filter)
}

// Human-readable label for the current filter
export function periodLabel(filter: string): string {
  if (!filter) return 'All time'
  if (filter.length === 4) return filter
  const [year, month] = filter.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}
