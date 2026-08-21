import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Plus, Trash2, CheckSquare, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { TaskForm } from './TaskForm'
import type { TaskFormValues } from './TaskForm'
import { useTasks, useAddTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useAuth } from '@/contexts/AuthContext'
import { cn, parseLocalDate } from '@/lib/utils'
import type { Task } from '@/types'

type FilterType = 'open' | 'completed' | 'all'
type SortDir = 'asc' | 'desc'

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

export function TasksSection() {
  const { user } = useAuth()
  const { data: tasks = [], isLoading } = useTasks()
  const addTask = useAddTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [filter, setFilter] = useState<FilterType>('open')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCount = tasks.filter((t) => !t.completed).length

  const filtered = useMemo(() => {
    const list = tasks.filter((t) => (filter === 'open' ? !t.completed : filter === 'completed' ? t.completed : true))
    return [...list].sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      const cmp = a.due_date.localeCompare(b.due_date)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [tasks, filter, sortDir])

  async function handleSubmit(values: TaskFormValues) {
    const payload = { title: values.title, due_date: values.due_date || null }
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

  async function toggleComplete(task: Task) {
    await updateTask.mutateAsync({ id: task.id, completed: !task.completed })
  }

  async function handleDelete(id: string) {
    await deleteTask.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <p className="text-sm text-gray-500 max-w-md">
          Personal to-dos and reminders. Tasks with a due date also appear on your Calendar.
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
              {filtered.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                  className="p-4 flex items-center gap-3"
                >
                  <button
                    onClick={() => void toggleComplete(task)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      task.completed ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                    )}
                  >
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <button onClick={() => openEdit(task)} className="min-w-0 flex-1 text-left">
                    <p className={cn('text-sm font-medium', task.completed ? 'text-gray-400 line-through' : 'text-gray-900')}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">{format(parseLocalDate(task.due_date), 'MMM d, yyyy')}</p>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(task.id)}
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
                        Due Date
                        {sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      </button>
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task, i) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => void toggleComplete(task)}
                          title={task.completed ? 'Mark as open' : 'Mark as complete'}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                            task.completed ? 'bg-primary-600 border-primary-600' : 'border-gray-300 hover:border-primary-400'
                          )}
                        >
                          {task.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => openEdit(task)} className="text-left">
                          <span className={cn('text-sm font-medium', task.completed ? 'text-gray-400 line-through' : 'text-gray-900')}>
                            {task.title}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {task.due_date ? format(parseLocalDate(task.due_date), 'EEE, MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteId(task.id)}
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
