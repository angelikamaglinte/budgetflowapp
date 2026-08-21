import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarClock, CheckSquare } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useInvoiceReminders } from '@/hooks/useInvoiceReminders'
import { useTasks } from '@/hooks/useTasks'
import { getReminderOccurrences } from '@/lib/reminders'
import { cn, parseLocalDate } from '@/lib/utils'

interface CalendarEvent {
  key: string
  date: Date
  kind: 'reminder' | 'task'
  label: string
  detail?: string | null
  completed?: boolean
}

type ViewMode = 'month' | 'week' | 'day'

function getInitialView(): ViewMode {
  if (typeof window === 'undefined') return 'month'
  const stored = localStorage.getItem('calendar-view')
  return stored === 'week' || stored === 'day' ? stored : 'month'
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const { data: reminders = [], isLoading: remindersLoading } = useInvoiceReminders()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const isLoading = remindersLoading || tasksLoading
  const [view, setView] = useState<ViewMode>(getInitialView)
  const [anchor, setAnchor] = useState(new Date())

  function changeView(v: ViewMode) {
    setView(v)
    localStorage.setItem('calendar-view', v)
  }

  const { rangeStart, rangeEnd, days, title } = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(anchor))
      const end = endOfWeek(endOfMonth(anchor))
      return { rangeStart: start, rangeEnd: end, days: eachDayOfInterval({ start, end }), title: format(anchor, 'MMMM yyyy') }
    }
    if (view === 'week') {
      const start = startOfWeek(anchor)
      const end = endOfWeek(anchor)
      return {
        rangeStart: start,
        rangeEnd: end,
        days: eachDayOfInterval({ start, end }),
        title: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
      }
    }
    return { rangeStart: anchor, rangeEnd: anchor, days: [anchor], title: format(anchor, 'EEEE, MMMM d, yyyy') }
  }, [view, anchor])

  const events = useMemo(() => {
    const reminderEvents: CalendarEvent[] = getReminderOccurrences(reminders, rangeStart, rangeEnd).map((occ, i) => ({
      key: `reminder-${occ.reminder.id}-${i}`,
      date: occ.date,
      kind: 'reminder',
      label: occ.reminder.client_name,
      detail: occ.reminder.notes,
    }))
    const taskEvents: CalendarEvent[] = tasks
      .filter((t) => t.due_date)
      .map((t) => ({ date: parseLocalDate(t.due_date!), task: t }))
      .filter((t) => t.date >= rangeStart && t.date <= rangeEnd)
      .map(({ date, task }) => ({
        key: `task-${task.id}`,
        date,
        kind: 'task' as const,
        label: task.title,
        completed: task.completed,
      }))
    return [...reminderEvents, ...taskEvents]
  }, [reminders, tasks, rangeStart, rangeEnd])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const key = format(event.date, 'yyyy-MM-dd')
      const list = map.get(key)
      if (list) list.push(event)
      else map.set(key, [event])
    }
    return map
  }, [events])

  function goPrev() {
    if (view === 'month') setAnchor((d) => subMonths(d, 1))
    else if (view === 'week') setAnchor((d) => subWeeks(d, 1))
    else setAnchor((d) => subDays(d, 1))
  }
  function goNext() {
    if (view === 'month') setAnchor((d) => addMonths(d, 1))
    else if (view === 'week') setAnchor((d) => addWeeks(d, 1))
    else setAnchor((d) => addDays(d, 1))
  }
  function goToday() {
    setAnchor(new Date())
  }

  return (
    <AppLayout title="Calendar" subtitle="A calendar view of your invoice reminders and tasks" showPeriodSelector={false}>
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition"
          >
            Today
          </button>
          <h2 className="font-semibold text-gray-900 ml-2">{title}</h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl shrink-0">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => changeView(v)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                view === v ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-700'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl h-96 animate-pulse" />
      ) : (
        <>
          {view !== 'day' && (
            <div className={cn('grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100', view === 'month' ? '' : '')}>
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="bg-gray-50 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2.5">
                  {label}
                </div>
              ))}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDay.get(key) ?? []
                const inCurrentMonth = view === 'week' || isSameMonth(day, anchor)
                const visiblePills = dayEvents.slice(0, view === 'week' ? 6 : 2)
                const overflow = dayEvents.length - visiblePills.length

                return (
                  <div
                    key={key}
                    className={cn(
                      'bg-white p-2 flex flex-col gap-1',
                      view === 'month' ? 'min-h-25' : 'min-h-55',
                      !inCurrentMonth && 'bg-gray-50/50'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0',
                        isToday(day) ? 'bg-primary-600 text-white' : inCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-col gap-1">
                      {visiblePills.map((event) => (
                        <span
                          key={event.key}
                          title={event.label}
                          className={cn(
                            'truncate px-1.5 py-0.5 rounded-md text-[11px] font-medium',
                            event.kind === 'reminder' && 'bg-[#E9F3F7] text-[#487CA5]',
                            event.kind === 'task' && !event.completed && 'bg-[#EEF3ED] text-[#548164]',
                            event.kind === 'task' && event.completed && 'bg-gray-100 text-gray-400 line-through'
                          )}
                        >
                          {event.label}
                        </span>
                      ))}
                      {overflow > 0 && (
                        <span className="text-[11px] text-gray-400 px-1.5">+{overflow} more</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'day' && (
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-6">
              {(eventsByDay.get(format(anchor, 'yyyy-MM-dd')) ?? []).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <CalendarClock className="w-6 h-6 text-primary-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Nothing scheduled on this day</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(eventsByDay.get(format(anchor, 'yyyy-MM-dd')) ?? []).map((event, i) => (
                    <motion.div
                      key={event.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl',
                        event.kind === 'reminder' && 'bg-[#E9F3F7]',
                        event.kind === 'task' && !event.completed && 'bg-[#EEF3ED]',
                        event.kind === 'task' && event.completed && 'bg-gray-50'
                      )}
                    >
                      {event.kind === 'reminder' ? (
                        <CalendarClock className="w-4 h-4 text-[#487CA5] shrink-0" />
                      ) : (
                        <CheckSquare className={cn('w-4 h-4 shrink-0', event.completed ? 'text-gray-400' : 'text-[#548164]')} />
                      )}
                      <div className="min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          event.kind === 'task' && event.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                        )}>
                          {event.label}
                        </p>
                        {event.detail && <p className="text-xs text-gray-500 truncate">{event.detail}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
