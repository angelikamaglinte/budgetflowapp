import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { computeBucketSplit, getBucketStyle } from '@/lib/payoutBuckets'
import type { PayoutBucket } from '@/types'

function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface TransferChecklistModalProps {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  amount: number
  buckets: PayoutBucket[]
}

export function TransferChecklistModal({ open, onClose, invoiceNumber, amount, buckets }: TransferChecklistModalProps) {
  const split = computeBucketSplit(amount, buckets)

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
          {split.map(({ bucket, amount: bucketAmount }, i) => {
            const style = getBucketStyle(i)
            const Icon = style.icon
            return (
              <div key={bucket.id} className={`flex items-center gap-3 p-3 ${style.iconBg} rounded-xl`}>
                <Icon className={`w-4 h-4 ${style.iconColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Move to {bucket.name}{bucket.percentage != null ? ` (${bucket.percentage}%)` : ''}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">{formatMoney(bucketAmount)}</p>
              </div>
            )
          })}
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
