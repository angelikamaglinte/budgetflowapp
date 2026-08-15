import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Pencil, Trash2, StickyNote } from 'lucide-react'
import type { Note } from '@/types'

interface NoteCardProps {
  note: Note
  delay?: number
  onOpen: () => void
  onDelete: () => void
}

export function NoteCard({ note, delay = 0, onOpen, onDelete }: NoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow flex flex-col cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <StickyNote className="w-4 h-4 text-primary-400 shrink-0" />
          <p className="font-medium text-gray-900 truncate">{note.title}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen() }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 whitespace-pre-line line-clamp-5 flex-1">
        {note.content || 'No content'}
      </p>
      <p className="text-xs text-gray-300 mt-3">Updated {format(new Date(note.updated_at), 'MMM d, yyyy')}</p>
    </motion.div>
  )
}
