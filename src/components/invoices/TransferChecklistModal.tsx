import { CheckCircle2, ShieldCheck, PiggyBank } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface TransferChecklistModalProps {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  amount: number
  taxRate: number
  savingsRate: number
}

export function TransferChecklistModal({ open, onClose, invoiceNumber, amount, taxRate, savingsRate }: TransferChecklistModalProps) {
  const taxAmount = amount * (taxRate / 100)
  const savingsAmount = amount * (savingsRate / 100)

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6">
        <div className="w-12 h-12 bg-[#EEF3ED] rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-[#548164]" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Invoice {invoiceNumber} marked paid</h3>
        <p className="text-sm text-gray-500 mb-5">
          You received {formatMoney(amount)}. Here's what to set aside now.
        </p>
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center gap-3 p-3 bg-[#FAECEC] rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#C4554D] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Move to Tax Reserve ({taxRate}%)</p>
            </div>
            <p className="text-sm font-bold text-gray-900 shrink-0">{formatMoney(taxAmount)}</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#E9F3F7] rounded-xl">
            <PiggyBank className="w-4 h-4 text-[#487CA5] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Move to Savings ({savingsRate}%)</p>
            </div>
            <p className="text-sm font-bold text-gray-900 shrink-0">{formatMoney(savingsAmount)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
        >
          Got it
        </button>
      </div>
    </Modal>
  )
}
