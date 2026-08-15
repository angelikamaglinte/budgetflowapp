import { useState } from 'react'
import { CalendarClock, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

interface DayOfMonthPickerProps {
  value: number | undefined
  onChange: (day: number) => void
}

export function DayOfMonthPicker({ value, onChange }: DayOfMonthPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        }
      >
        <span className={cn('flex items-center gap-2', value ? 'text-gray-900' : 'text-gray-400')}>
          <CalendarClock className="w-4 h-4 text-gray-400" />
          {value ? `${ordinal(value)} of every month` : 'Select a day'}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-72 rounded-2xl border border-gray-100 bg-white/95 p-3 shadow-xl backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <DropdownMenuItem
              key={day}
              render={
                <button
                  type="button"
                  onClick={() => onChange(day)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg text-sm cursor-pointer transition-all',
                    value === day ? 'bg-primary-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
                  )}
                />
              }
            >
              {day}
            </DropdownMenuItem>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 px-1">
          Repeats every month. Months with fewer days use their last day.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
