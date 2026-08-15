import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Pencil, Copy, Download, Trash2, FileText } from 'lucide-react'
import { parseLocalDate } from '@/lib/utils'
import { computeSubtotal, computeTax, computeTotal, formatMoney } from '@/lib/pdfInvoice'
import type { PdfInvoice } from '@/types'

interface PdfInvoiceCardProps {
  invoice: PdfInvoice
  delay?: number
  onEdit: () => void
  onDuplicate: () => void
  onDownload: () => void
  onDelete: () => void
  downloading?: boolean
}

export function PdfInvoiceCard({ invoice, delay = 0, onEdit, onDuplicate, onDownload, onDelete, downloading }: PdfInvoiceCardProps) {
  const subtotal = computeSubtotal(invoice.line_items)
  const tax = computeTax(subtotal, invoice.tax_rate)
  const total = computeTotal(subtotal, tax)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{invoice.client_name}</p>
          <p className="text-xs text-gray-400">
            Invoice #{invoice.invoice_number} · {format(parseLocalDate(invoice.invoice_date), 'MMM d, yyyy')}
          </p>
        </div>
        <FileText className="w-4 h-4 text-gray-300 shrink-0" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-3">{formatMoney(total)}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition disabled:opacity-60"
        >
          <Download className="w-3.5 h-3.5" /> {downloading ? 'Preparing...' : 'PDF'}
        </button>
        <button onClick={onEdit} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDuplicate} title="Duplicate" className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition ml-auto">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
