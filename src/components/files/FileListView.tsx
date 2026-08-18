import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { FileText, Trash2, ExternalLink, ImageIcon, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { FileTypeBadge } from './FileTypeBadge'
import { cn } from '@/lib/utils'
import type { Receipt, Expense } from '@/types'

function isImage(filename: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(filename)
}

type SortKey = 'filename' | 'category' | 'uploaded_at'
type SortDir = 'asc' | 'desc'

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  filename: 'asc',
  category: 'asc',
  uploaded_at: 'desc',
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <th className={cn('text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn('flex items-center gap-1 transition-colors hover:text-gray-700', active && 'text-gray-600')}
      >
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  )
}

function FileThumb({ file }: { file: Receipt }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
      {isImage(file.filename) ? (
        <img src={file.public_url} alt={file.filename} className="w-full h-full object-cover" />
      ) : (
        <FileText className="w-4 h-4 text-gray-300" />
      )}
    </div>
  )
}

interface FileListViewProps {
  files: Receipt[]
  expenses: Expense[]
  onDelete: (file: Receipt) => void
  onLinkChange: (fileId: string, expenseId: string) => void
}

export function FileListView({ files, expenses, onDelete, onLinkChange }: FileListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('uploaded_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(DEFAULT_DIR[key])
    }
  }

  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      const cmp =
        sortKey === 'uploaded_at'
          ? new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
          : a[sortKey].localeCompare(b[sortKey])
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [files, sortKey, sortDir])

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
      {/* Mobile row list */}
      <div className="sm:hidden flex flex-col divide-y divide-gray-50">
        {sortedFiles.map((file, i) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
            className="p-4 flex items-center gap-3"
          >
            <FileThumb file={file} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>{file.filename}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <FileTypeBadge category={file.category} />
                <span className="text-xs text-gray-400">{format(new Date(file.uploaded_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                title="View"
              >
                {isImage(file.filename) ? <ImageIcon className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              </a>
              <button
                onClick={() => onDelete(file)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table (tablet+) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <SortHeader
                label="File"
                active={sortKey === 'filename'}
                dir={sortDir}
                onClick={() => toggleSort('filename')}
                className="px-6"
              />
              <SortHeader label="Category" active={sortKey === 'category'} dir={sortDir} onClick={() => toggleSort('category')} />
              <SortHeader
                label="Uploaded"
                active={sortKey === 'uploaded_at'}
                dir={sortDir}
                onClick={() => toggleSort('uploaded_at')}
                className="hidden md:table-cell"
              />
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Linked Expense</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file, i) => (
              <motion.tr
                key={file.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <FileThumb file={file} />
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]" title={file.filename}>
                      {file.filename}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <FileTypeBadge category={file.category} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                  {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <select
                    value={file.expense_id ?? ''}
                    onChange={(e) => onLinkChange(file.id, e.target.value)}
                    className="w-full max-w-[180px] text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                  >
                    <option value="">Not linked</option>
                    {expenses.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.title} (${exp.amount})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={file.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition inline-flex"
                      title="View"
                    >
                      {isImage(file.filename) ? <ImageIcon className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </a>
                    <button
                      onClick={() => onDelete(file)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
