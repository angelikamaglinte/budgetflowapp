import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Plus, Trash2, CheckSquare, ArrowUp, ArrowDown, Check, Link2, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { TaskForm } from './TaskForm'
import type { TaskFormValues } from './TaskForm'
import { useTasks, useAddTask, useUpdateTask, useDeleteTask, useTaskCompletions, useCompleteOccurrence } from '@/hooks/useTasks'
import { useAuth } from '@/contexts/AuthContext'
import { cn, parseLocalDate } from '@/lib/utils'
import { getNextOccurrence, describeRRule } from '@/lib/recurrence'
import type { Task } from '@/types'

type FilterType = 'open' | 'completed' | 'all'
type SortDir = 'asc' | 'desc'

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

interface DisplayTask {
  task: Task
  isRecurring: boolean
  displayDate: Date | null
  occurrenceDate: string | null
  displayCompleted: boolean
}

export function TasksSection() {
  const { user } = useAuth()
  const { data: tasks = [], isLoading } = useTasks()
  const { data: completions = [] } = useTaskCompletions()
  const addTask = useAddTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const completeOccurrence = useCompleteOccurrence()

  const [filter, setFilter] = useState<FilterType>('open')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const completionsByTask = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of completions) {
      const list = map.get(c.task_id) ?? []
      list.push(c.occurrence_date)
      map.set(c.task_id, list)
    }
    return map
  }, [completions])

  // Non-recurring tasks keep using Task.completed directly. Recurring tasks
  // show as a single row — their next not-yet-completed occurrence — and
  // count as "completed" once a bounded rule runs out of future occurrences.
  const displayTasks: DisplayTask[] = useMemo(() => {
    return tasks.map((task) => {
      if (task.recurrence_rule && task.due_date) {
        const excluded = completionsByTask.get(task.id) ?? []
        const next = getNextOccurrence(task.recurrence_rule, task.due_date, excluded)
        return {
          task,
          isRecurring: true,
          displayDate: next,
          occurrenceDate: next ? format(next, 'yyyy-MM-dd') : null,
          displayCompleted: next === null,
        }
      }
      return {
        task,
        isRecurring: false,
        displayDate: task.due_date ? parseLocalDate(task.due_date) : null,
        occurrenceDate: task.due_date,
        displayCompleted: task.completed,
      }
    })
  }, [tasks, completionsByTask])

  const openCount = displayTasks.filter((dt) => !dt.displayCompleted).length

  const filtered = useMemo(() => {
    const list = displayTasks.filter((dt) =>
      filter === 'open' ? !dt.displayCompleted : filter === 'completed' ? dt.displayCompleted : true
    )
    return [...list].sort((a, b) => {
      if (!a.displayDate && !b.displayDate) return 0
      if (!a.displayDate) return 1
      if (!b.displayDate) return -1
      const cmp = a.displayDate.getTime() - b.displayDate.getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [displayTasks, filter, sortDir])

  async function handleSubmit(values: TaskFormValues) {
    const hasDate = !!values.due_date
    const payload = {
      title: values.title,
      due_date: values.due_date || null,
      due_time: hasDate && !values.all_day ? values.due_time || null : null,
      all_day: hasDate ? values.all_day ?? true : true,
      recurrence_rule: hasDate ? values.recurrence_rule ?? null : null,
      link_url: values.link_url || null,
      description: values.description || null,
    }
    if (editTarget) {
      await updateTask.mutateAsync({ id: editTarget.id, ...payload })
    } else {
      await addTask.mutateAsync({ ...payload, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(task: Task) {
    setEditTarget(task)
    setFormOpen(true)
  }

  async function toggleComplete(dt: DisplayTask) {
    if (dt.isRecurring) {
      if (!dt.occurrenceDate) return
      await completeOccurrence.mutateAsync({ taskId: dt.task.id, occurrenceDate: dt.occurrenceDate, userId: user!.id })
    } else {
      await updateTask.mutateAsync({ id: dt.task.id, completed: !dt.task.completed })
    }
  }

  async function handleDelete(id: string) {
    await deleteTask.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <p className="text-sm text-gray-500 max-w-md">
          Personal to-dos and reminders — repeat them, attach a link, add a note. Tasks with a date also appear on your Calendar.
        </p>
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Task
        </PrimaryButton>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
              filter === f.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
            )}
          >
            {f.label}
            {f.id === 'open' && openCount > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[11px] font-semibold',
                  filter === f.id ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-700'
                )}
              >
                {openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {filter === 'open' ? 'No open tasks — nice work' : filter === 'completed' ? 'No completed tasks yet' : 'No tasks yet'}
            </p>
            {filter !== 'completed' && (
              <button
                onClick={() => { setEditTarget(null); setFormOpen(true) }}
                className="text-primary-600 text-sm font-medium hover:underline"
              >
                Add a task
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden flex flex-col divide-y divide-gray-50">
              {filtered.map((dt, i) => (
                <motion.div
                  key={dt.task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                  className="p-4 flex items-center gap-3"
                >
                  <button
                    onClick={() => void toggleComplete(dt)}
                    disabled={dt.isRecurring && !dt.occurrenceDate}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      dt.displayCompleted ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                    )}
                  >
                    {dt.displayCompleted && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <button onClick={() => openEdit(dt.task)} className="min-w-0 flex-1 text-left">
                    <p className={cn('text-sm font-medium', dt.displayCompleted ? 'text-gray-400 line-through' : 'text-gray-900')}>
                      {dt.task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {dt.displayDate && (
                        <p className="text-xs text-gray-400">
                          {format(dt.displayDate, 'MMM d, yyyy')}
                          {!dt.task.all_day && dt.task.due_time && ` · ${dt.task.due_time}`}
                        </p>
                      )}
                      {dt.isRecurring && dt.task.due_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary-600">
                          <RefreshCw className="w-2.5 h-2.5" /> {describeRRule(dt.task.recurrence_rule, dt.task.due_date)}
                        </span>
                      )}
                      {dt.task.link_url && <Link2 className="w-3 h-3 text-gray-400" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setDeleteId(dt.task.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Table (tablet+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 w-10" />
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Title</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        Date
                        {sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      </button>
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((dt, i) => (
                    <motion.tr
                      key={dt.task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => void toggleComplete(dt)}
                          disabled={dt.isRecurring && !dt.occurrenceDate}
                          title={dt.displayCompleted ? 'Mark as open' : 'Mark as complete'}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                            dt.displayCompleted ? 'bg-primary-600 border-primary-600' : 'border-gray-300 hover:border-primary-400'
                          )}
                        >
                          {dt.displayCompleted && <Check className="w-3 h-3 text-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => openEdit(dt.task)} className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-sm font-medium', dt.displayCompleted ? 'text-gray-400 line-through' : 'text-gray-900')}>
                              {dt.task.title}
                            </span>
                            {dt.isRecurring && dt.task.due_date && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-primary-600 shrink-0">
                                <RefreshCw className="w-2.5 h-2.5" /> {describeRRule(dt.task.recurrence_rule, dt.task.due_date)}
                              </span>
                            )}
                            {dt.task.link_url && <Link2 className="w-3 h-3 text-gray-400 shrink-0" />}
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {dt.displayDate
                          ? `${format(dt.displayDate, 'EEE, MMM d, yyyy')}${!dt.task.all_day && dt.task.due_time ? ` · ${dt.task.due_time}` : ''}`
                          : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteId(dt.task.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this task?</h3>
          <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && void handleDelete(deleteId)}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
