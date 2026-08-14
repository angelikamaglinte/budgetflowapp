import { format } from 'date-fns'
import { motion } from 'motion/react'
import { FileText, Trash2, ExternalLink, ImageIcon } from 'lucide-react'
import { FileTypeBadge } from './FileTypeBadge'
import type { Receipt, Expense } from '@/types'

function isImage(filename: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(filename)
}

interface FileGridViewProps {
  files: Receipt[]
  expenses: Expense[]
  onDelete: (file: Receipt) => void
  onLinkChange: (fileId: string, expenseId: string) => void
}

export function FileGridView({ files, expenses, onDelete, onLinkChange }: FileGridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file, i) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i, 15) * 0.03 }}
          whileHover={{ y: -3 }}
          className="group bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
        >
          {/* Thumbnail */}
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {isImage(file.filename) ? (
              <img
                src={file.public_url}
                alt={file.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <FileText className="w-10 h-10 text-gray-300" />
                <span className="text-xs text-gray-400 uppercase font-medium">PDF</span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-white/90 rounded-lg hover:bg-white transition"
                title="View"
              >
                {isImage(file.filename)
                  ? <ImageIcon className="w-4 h-4 text-gray-700" />
                  : <ExternalLink className="w-4 h-4 text-gray-700" />
                }
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(file) }}
                className="p-2 bg-white/90 rounded-lg hover:bg-red-50 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-medium text-gray-700 truncate" title={file.filename}>
                {file.filename}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <FileTypeBadge category={file.category} />
              <p className="text-xs text-gray-400 shrink-0">
                {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
              </p>
            </div>
            {/* Link to expense */}
            <select
              value={file.expense_id ?? ''}
              onChange={(e) => onLinkChange(file.id, e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
              title="Link to expense"
            >
              <option value="">Link to expense...</option>
              {expenses.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} (${exp.amount})
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
