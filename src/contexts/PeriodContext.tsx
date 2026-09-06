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
// filter '' = all time, 'YYYY' = year, 'YYYY-MM' = month, 'range:start:end' = custom range
export function matchesPeriod(dateStr: string, filter: string): boolean {
  if (!filter) return true
  if (filter.startsWith('range:')) {
    const [, start, end] = filter.split(':')
    // ISO date strings (YYYY-MM-DD) compare lexicographically the same as chronologically.
    return dateStr >= start && dateStr <= end
  }
  return dateStr.startsWith(filter)
}

// Human-readable label for the current filter
export function periodLabel(filter: string): string {
  if (!filter) return 'All time'
  if (filter.startsWith('range:')) {
    const [, start, end] = filter.split(':')
    const startDate = new Date(`${start}T00:00:00`)
    const endDate = new Date(`${end}T00:00:00`)
    const startLabel = startDate.toLocaleString('default', { month: 'short', day: 'numeric' })
    const endLabel = endDate.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startLabel} – ${endLabel}`
  }
  if (filter.length === 4) return filter
  const [year, month] = filter.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}
