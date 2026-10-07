import { useRef, useState } from 'react'
import { RefreshCw, ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Modal } from '@/components/ui/Modal'
import { cn, parseLocalDate } from '@/lib/utils'
import { buildRRuleString, describeRRule } from '@/lib/recurrence'
import type { RepeatQuickPick, CustomRepeatOptions, RepeatEnd } from '@/lib/recurrence'

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const QUICK_PICKS: { id: RepeatQuickPick }[] = [
  { id: 'none' },
  { id: 'daily' },
  { id: 'weekday' },
  { id: 'weekly' },
  { id: 'biweekly' },
  { id: 'monthly' },
  { id: 'yearly' },
]

function quickPickLabel(pick: RepeatQuickPick, startDate: string): string {
  return describeRRule(buildRRuleString(pick, startDate), startDate)
}

function defaultCustomOptions(startDate: string): CustomRepeatOptions {
  return { interval: 1, unit: 'week', weekdays: [parseLocalDate(startDate).getDay()], end: { type: 'never' } }
}

interface RepeatPickerProps {
  value: string | null
  onChange: (rule: string | null) => void
  startDate: string
}

export function RepeatPicker({ value, onChange, startDate }: RepeatPickerProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuActionsRef = useRef<{ unmount: () => void; close: () => void }>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [draft, setDraft] = useState<CustomRepeatOptions>(() => defaultCustomOptions(startDate))

  // Which quick-pick (if any) the current value is equivalent to — used only
  // to highlight the matching radio item; a non-matching value (built via
  // Custom) simply highlights nothing, which is fine since the trigger label
  // already shows its real description.
  const selectedPick = QUICK_PICKS.find((p) => buildRRuleString(p.id, startDate) === value)?.id ?? null

  function openCustom() {
    setDraft(defaultCustomOptions(startDate))
    menuActionsRef.current?.close()
    setCustomOpen(true)
  }

  function toggleWeekday(day: number) {
    setDraft((d) => ({
      ...d,
      weekdays: d.weekdays?.includes(day) ? d.weekdays.filter((w) => w !== day) : [...(d.weekdays ?? []), day].sort(),
    }))
  }

  function applyCustom() {
    onChange(buildRRuleString('custom', startDate, draft))
    setCustomOpen(false)
  }

  return (
    <>
      <DropdownMenu actionsRef={menuActionsRef} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="w-full flex items-center justify-between pl-3 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          }
        >
          <span className="flex items-center gap-2 text-gray-900 min-w-0 truncate">
            <RefreshCw className="w-4 h-4 text-gray-400 shrink-0" />
            {describeRRule(value, startDate)}
          </span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform', menuOpen && 'rotate-180')} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuRadioGroup
            value={selectedPick ?? ''}
            onValueChange={(v) => {
              const pick = String(v) as RepeatQuickPick
              onChange(buildRRuleString(pick, startDate))
            }}
          >
            {QUICK_PICKS.map((p) => (
              <DropdownMenuRadioItem
                key={p.id}
                value={p.id}
                render={<button type="button" className="flex w-full cursor-pointer items-center" />}
              >
                {quickPickLabel(p.id, startDate)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<button type="button" className="flex w-full cursor-pointer items-center" onClick={openCustom} />}
          >
            Custom...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Modal open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="max-w-sm">
        <div className="p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900">Custom Repeat</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Every</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={draft.interval}
                onChange={(e) => setDraft((d) => ({ ...d, interval: Math.max(1, Number(e.target.value) || 1) }))}
                className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={draft.unit}
                onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value as CustomRepeatOptions['unit'] }))}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="day">day{draft.interval > 1 ? 's' : ''}</option>
                <option value="week">week{draft.interval > 1 ? 's' : ''}</option>
                <option value="month">month{draft.interval > 1 ? 's' : ''}</option>
                <option value="year">year{draft.interval > 1 ? 's' : ''}</option>
              </select>
            </div>
          </div>

          {draft.unit === 'week' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">On</label>
              <div className="flex items-center gap-1.5">
                {WEEKDAY_LETTER.map((letter, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    title={WEEKDAY_SHORT[day]}
                    className={cn(
                      'w-8 h-8 rounded-full text-xs font-semibold transition-colors',
                      draft.weekdays?.includes(day)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ends</label>
            <div className="flex flex-col gap-2">
              {(['never', 'on', 'after'] as RepeatEnd['type'][]).map((type) => (
                <label key={type} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={draft.end.type === type}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        end:
                          type === 'never'
                            ? { type: 'never' }
                            : type === 'on'
                            ? { type: 'on', date: new Date().toISOString().split('T')[0] }
                            : { type: 'after', count: 4 },
                      }))
                    }
                    className="w-4 h-4 accent-primary-600 cursor-pointer shrink-0"
                  />
                  {type === 'never' && 'Never'}
                  {type === 'on' && (
                    <span className="flex items-center gap-2">
                      On
                      <input
                        type="date"
                        disabled={draft.end.type !== 'on'}
                        value={draft.end.type === 'on' ? draft.end.date : ''}
                        onChange={(e) => setDraft((d) => ({ ...d, end: { type: 'on', date: e.target.value } }))}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </span>
                  )}
                  {type === 'after' && (
                    <span className="flex items-center gap-2">
                      After
                      <input
                        type="number"
                        min={1}
                        disabled={draft.end.type !== 'after'}
                        value={draft.end.type === 'after' ? draft.end.count : ''}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, end: { type: 'after', count: Math.max(1, Number(e.target.value) || 1) } }))
                        }
                        className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      times
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCustom}
              disabled={draft.unit === 'week' && (!draft.weekdays || draft.weekdays.length === 0)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
