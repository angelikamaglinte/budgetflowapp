import { useRef, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Upload, FileText, Trash2, ExternalLink, ImageIcon } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { FileTypeBadge } from '@/components/files/FileTypeBadge'
import { useFiles, useUploadFile, useDeleteFile, useLinkFileToExpense } from '@/hooks/useFiles'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/contexts/AuthContext'
import { usePeriod, matchesPeriod } from '@/contexts/PeriodContext'
import { cn } from '@/lib/utils'
import type { Receipt, FileCategory } from '@/types'
import { FILE_CATEGORY_LABELS } from '@/types'

function isImage(filename: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(filename)
}

type TabType = 'all' | FileCategory

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'contract', label: 'Contracts' },
  { id: 'invoice', label: 'Invoices' },
  { id: 'receipt', label: 'Receipts' },
  { id: 'other', label: 'Other' },
]

const UPLOAD_CATEGORIES: FileCategory[] = ['receipt', 'contract', 'invoice', 'other']

export default function Files() {
  const { user } = useAuth()
  const { data: files = [], isLoading } = useFiles()
  const { data: expenses = [] } = useExpenses()
  const uploadFile = useUploadFile()
  const deleteFile = useDeleteFile()
  const linkFile = useLinkFileToExpense()

  const { periodFilter } = usePeriod()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [uploadCategory, setUploadCategory] = useState<FileCategory>('receipt')

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchPeriod = matchesPeriod(f.uploaded_at, periodFilter)
      const matchTab = activeTab === 'all' || f.category === activeTab
      return matchPeriod && matchTab
    })
  }, [files, periodFilter, activeTab])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Receipt | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !user) return
    setUploadError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`${file.name} is too large (max 10MB)`)
          continue
        }
        await uploadFile.mutateAsync({ file, category: uploadCategory, userId: user.id })
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

  async function handleDelete(file: Receipt) {
    await deleteFile.mutateAsync({ id: file.id, storagePath: file.storage_path })
    setDeleteTarget(null)
  }

  async function handleLinkChange(fileId: string, expenseId: string) {
    await linkFile.mutateAsync({ fileId, expenseId: expenseId || null })
  }

  return (
    <AppLayout
      title="Files"
      subtitle="Every file you've uploaded, sorted by type"
      action={
        <PrimaryButton
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Upload className="w-4 h-4" /> Upload File
        </PrimaryButton>
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

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
              activeTab === tab.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload category picker */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500">Upload as:</span>
        <div className="flex gap-1.5 flex-wrap">
          {UPLOAD_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setUploadCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                uploadCategory === cat
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {FILE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

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
                {dragOver ? 'Drop files here' : `Drag & drop files here, or click to browse (will be tagged as ${FILE_CATEGORY_LABELS[uploadCategory]})`}
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
      ) : filteredFiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-12"
        >
          <p className="text-gray-400 text-sm">
            {files.length === 0 ? 'No files uploaded yet' : 'No files match this filter'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file, i) => (
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
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(file) }}
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
                  onChange={(e) => void handleLinkChange(file.id, e.target.value)}
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
      )}

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete file?</h3>
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
