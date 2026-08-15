import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, FileText, Building2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { BusinessProfileForm } from './BusinessProfileForm'
import type { BusinessProfileFormValues } from './BusinessProfileForm'
import { InvoiceBuilderForm } from './InvoiceBuilderForm'
import type { InvoiceBuilderFormValues } from './InvoiceBuilderForm'
import { PdfInvoiceCard } from './PdfInvoiceCard'
import { useBusinessProfile, useSaveBusinessProfile } from '@/hooks/useBusinessProfile'
import { usePdfInvoices, useAddPdfInvoice, useUpdatePdfInvoice, useDeletePdfInvoice } from '@/hooks/usePdfInvoices'
import { useAuth } from '@/contexts/AuthContext'
import { downloadInvoicePdf } from '@/lib/downloadInvoicePdf'
import type { PdfInvoice } from '@/types'

export function InvoiceBuilderSection() {
  const { user } = useAuth()
  const { data: businessProfile, isLoading: loadingProfile } = useBusinessProfile()
  const saveProfile = useSaveBusinessProfile()
  const { data: invoices = [], isLoading: loadingInvoices } = usePdfInvoices()
  const addInvoice = useAddPdfInvoice()
  const updateInvoice = useUpdatePdfInvoice()
  const deleteInvoice = useDeletePdfInvoice()

  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PdfInvoice | null>(null)
  const [duplicateSource, setDuplicateSource] = useState<PdfInvoice | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleProfileSubmit(values: BusinessProfileFormValues) {
    await saveProfile.mutateAsync({ ...values, user_id: user!.id })
    setProfileFormOpen(false)
  }

  async function handleSubmit(values: InvoiceBuilderFormValues) {
    const payload = {
      ...values,
      due_date: values.due_date || null,
      terms: values.terms || null,
      client_company: values.client_company || null,
      client_address: values.client_address || null,
      thank_you_note: values.thank_you_note || null,
      line_items: values.line_items.map((item) => ({
        description: item.description,
        date_start: item.date_start || null,
        date_end: item.date_end || null,
        qty: Number(item.qty),
        rate: Number(item.rate),
      })),
    }
    if (editTarget) {
      await updateInvoice.mutateAsync({ id: editTarget.id, ...payload })
    } else {
      await addInvoice.mutateAsync({ ...payload, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
    setDuplicateSource(null)
  }

  function openNew() {
    setEditTarget(null)
    setDuplicateSource(null)
    setFormOpen(true)
  }
  function openEdit(invoice: PdfInvoice) {
    setEditTarget(invoice)
    setDuplicateSource(null)
    setFormOpen(true)
  }
  function openDuplicate(invoice: PdfInvoice) {
    setEditTarget(null)
    setDuplicateSource(invoice)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteInvoice.mutateAsync(id)
    setDeleteId(null)
  }

  async function handleDownload(invoice: PdfInvoice) {
    setDownloadingId(invoice.id)
    try {
      await downloadInvoicePdf(businessProfile ?? null, invoice)
    } finally {
      setDownloadingId(null)
    }
  }

  const isLoading = loadingProfile || loadingInvoices

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <button
          onClick={() => setProfileFormOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition"
        >
          <Building2 className="w-4 h-4" />
          {businessProfile ? 'Edit Business Info' : 'Set Your Business Info'}
        </button>
        <PrimaryButton onClick={openNew} className="px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> New Invoice
        </PrimaryButton>
      </div>

      {!isLoading && !businessProfile && (
        <div className="mb-5 bg-[#FAF3DD] border border-[#F3E7C4] text-[#8a6d2f] text-sm px-4 py-3 rounded-xl">
          Set your business info first so it appears at the top of your invoice PDFs.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col items-center justify-center py-16 gap-3"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-gray-500 text-sm">No invoices yet</p>
          <button onClick={openNew} className="text-primary-600 text-sm font-medium hover:underline">
            Create an invoice
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv, i) => (
            <PdfInvoiceCard
              key={inv.id}
              invoice={inv}
              delay={Math.min(i, 15) * 0.05}
              onEdit={() => openEdit(inv)}
              onDuplicate={() => openDuplicate(inv)}
              onDownload={() => void handleDownload(inv)}
              onDelete={() => setDeleteId(inv.id)}
              downloading={downloadingId === inv.id}
            />
          ))}
        </div>
      )}

      <BusinessProfileForm
        open={profileFormOpen}
        onClose={() => setProfileFormOpen(false)}
        onSubmit={handleProfileSubmit}
        initial={businessProfile}
      />

      <InvoiceBuilderForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); setDuplicateSource(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? duplicateSource ?? undefined}
        isEditing={!!editTarget}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete this invoice?</h3>
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
