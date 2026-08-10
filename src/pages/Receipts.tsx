import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Upload, FileText, Trash2, ExternalLink, ImageIcon } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { useReceipts, useUploadReceipt, useDeleteReceipt } from '@/hooks/useReceipts'
import { useExpenses } from '@/hooks/useExpenses'
import { useLinkReceiptToExpense } from '@/hooks/useReceipts'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod, matchesPeriod } from '@/contexts/PeriodContext'
import type { Receipt } from '@/types'

function isImage(filename: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(filename)
}

export default function Receipts() {
  const { user } = useAuth()
  const { data: receipts = [], isLoading } = useReceipts()
  const { data: expenses = [] } = useExpenses()
  const uploadReceipt = useUploadReceipt()
  const deleteReceipt = useDeleteReceipt()
  const linkReceipt = useLinkReceiptToExpense()

  const { periodFilter } = usePeriod()
  const filteredReceipts = receipts.filter((r) => matchesPeriod(r.uploaded_at, periodFilter))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Receipt | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || !user) return
    setUploadError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`${file.name} is too large (max 10MB)`)
          continue
        }
        await uploadReceipt.mutateAsync({ file, userId: user.id })
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    void handleFiles(e.dataTransfer.files)
  }

  async function handleDelete(receipt: Receipt) {
    await deleteReceipt.mutateAsync({ id: receipt.id, storagePath: receipt.storage_path })
    setDeleteTarget(null)
  }

  async function handleLinkChange(receiptId: string, expenseId: string) {
    await linkReceipt.mutateAsync({ receiptId, expenseId: expenseId || null })
  }

  return (
    <AppLayout
      title="Receipts"
      subtitle="Upload and manage your expense receipts"
      action={
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
        >
          <Upload className="w-4 h-4" /> Upload Receipt
        </button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          borderColor: dragOver ? '#142127' : '#e5e7eb',
          backgroundColor: dragOver ? '#faf8f5' : '#ffffff',
          scale: dragOver ? 1.01 : 1,
        }}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
        className="mb-6 border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer"
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: dragOver ? 1.15 : 1, rotate: dragOver ? -8 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragOver ? 'bg-primary-100' : 'bg-gray-100'}`}
          >
            <Upload className={`w-6 h-6 ${dragOver ? 'text-primary-600' : 'text-gray-400'}`} />
          </motion.div>
          {uploading ? (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-sm text-primary-600 font-medium"
            >
              Uploading...
            </motion.p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {dragOver ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
              </p>
              <p className="text-xs text-gray-400">Supports JPG, PNG, PDF · Max 10MB per file</p>
            </>
          )}
        </div>
      </motion.div>

      {uploadError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {uploadError}
        </div>
      )}

      {/* Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            {receipts.length === 0 ? 'No receipts uploaded yet' : 'No receipts for the selected period'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {isImage(receipt.filename) ? (
                  <img
                    src={receipt.public_url}
                    alt={receipt.filename}
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
                    href={receipt.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white/90 rounded-lg hover:bg-white transition"
                    title="View"
                  >
                    {isImage(receipt.filename)
                      ? <ImageIcon className="w-4 h-4 text-gray-700" />
                      : <ExternalLink className="w-4 h-4 text-gray-700" />
                    }
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(receipt) }}
                    className="p-2 bg-white/90 rounded-lg hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-medium text-gray-700 truncate mb-1" title={receipt.filename}>
                  {receipt.filename}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {format(new Date(receipt.uploaded_at), 'MMM d, yyyy')}
                </p>
                {/* Link to expense */}
                <select
                  value={receipt.expense_id ?? ''}
                  onChange={(e) => void handleLinkChange(receipt.id, e.target.value)}
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
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete receipt?</h3>
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-medium text-gray-700">{deleteTarget?.filename}</span> will be permanently removed.
          </p>
          <p className="text-sm text-gray-400 mb-5">This cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
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
