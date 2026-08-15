import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, StickyNote } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { NoteForm } from '@/components/notes/NoteForm'
import type { NoteFormValues } from '@/components/notes/NoteForm'
import { NoteCard } from '@/components/notes/NoteCard'
import { useNotes, useAddNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import { useAuth } from '@/contexts/AuthContext'
import type { Note } from '@/types'

export default function Notes() {
  const { user } = useAuth()
  const { data: notes = [], isLoading } = useNotes()
  const addNote = useAddNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSubmit(values: NoteFormValues) {
    if (editTarget) {
      await updateNote.mutateAsync({ id: editTarget.id, ...values })
    } else {
      await addNote.mutateAsync({ ...values, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(note: Note) {
    setEditTarget(note)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteNote.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <AppLayout
      title="Notes"
      subtitle="Private to your account"
      showPeriodSelector={false}
      action={
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Note
        </PrimaryButton>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <StickyNote className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-gray-500 text-sm">No notes yet</p>
          <button
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            Add a note
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              delay={Math.min(i, 15) * 0.05}
              onOpen={() => openEdit(note)}
              onDelete={() => setDeleteId(note.id)}
            />
          ))}
        </div>
      )}

      <NoteForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this note?</h3>
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
    </AppLayout>
  )
}
