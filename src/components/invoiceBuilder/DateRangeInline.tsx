import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DateRangeInlineProps {
  dateStart: string | null
  dateEnd: string | null
  onChange: (dateStart: string | null, dateEnd: string | null) => void
}

export function DateRangeInline({ dateStart, dateEnd, onChange }: DateRangeInlineProps) {
  const [mode, setMode] = useState<'single' | 'range'>(
    dateEnd && dateEnd !== dateStart ? 'range' : 'single'
  )

  function switchMode(next: 'single' | 'range') {
    setMode(next)
    if (next === 'single') {
      onChange(dateStart, dateStart)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 p-0.5 bg-gray-200/60 rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => switchMode('single')}
          className={cn(
            'px-2 py-1 rounded-md text-xs font-medium transition-all',
            mode === 'single' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Single day
        </button>
        <button
          type="button"
          onClick={() => switchMode('range')}
          className={cn(
            'px-2 py-1 rounded-md text-xs font-medium transition-all',
            mode === 'range' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Date range
        </button>
      </div>

      <input
        type="date"
        value={dateStart ?? ''}
        onChange={(e) => {
          const value = e.target.value || null
          onChange(value, mode === 'single' ? value : dateEnd)
        }}
        className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />

      {mode === 'range' && (
        <>
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateEnd ?? ''}
            min={dateStart ?? undefined}
            onChange={(e) => onChange(dateStart, e.target.value || null)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </>
      )}
    </div>
  )
}
