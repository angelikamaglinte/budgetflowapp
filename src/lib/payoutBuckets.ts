import { ShieldCheck, PiggyBank, Landmark, Wallet, TrendingUp, Banknote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PayoutBucket } from '@/types'

export interface BucketSplitEntry {
  bucket: PayoutBucket
  amount: number
}

// Non-remainder buckets get their fixed percentage of the amount; the one
// remainder bucket (percentage === null) absorbs whatever's left over —
// which can go negative if the fixed percentages add up to more than
// 100%. That's a real overspend signal, not a bug, so it isn't clamped.
export function computeBucketSplit(amount: number, buckets: PayoutBucket[]): BucketSplitEntry[] {
  let fixedTotal = 0
  const entries: BucketSplitEntry[] = buckets.map((bucket) => {
    if (bucket.percentage == null) return { bucket, amount: 0 } // filled in below
    const share = amount * (bucket.percentage / 100)
    fixedTotal += share
    return { bucket, amount: share }
  })

  const remainderIndex = buckets.findIndex((b) => b.percentage == null)
  if (remainderIndex !== -1) {
    entries[remainderIndex] = { bucket: buckets[remainderIndex], amount: amount - fixedTotal }
  }

  return entries
}

// Sum of every non-remainder bucket's percentage — "how much of every
// dollar is already spoken for" before whatever's left becomes yours.
export function computeReservedRate(buckets: PayoutBucket[]): number {
  return buckets.reduce((sum, b) => sum + (b.percentage ?? 0), 0)
}

const BUCKET_STYLES: { icon: LucideIcon; iconBg: string; iconColor: string }[] = [
  { icon: ShieldCheck, iconBg: 'bg-[#FAECEC]', iconColor: 'text-[#C4554D]' },
  { icon: PiggyBank, iconBg: 'bg-[#E9F3F7]', iconColor: 'text-[#487CA5]' },
  { icon: Landmark, iconBg: 'bg-[#F6F3F8]', iconColor: 'text-[#8A67AB]' },
  { icon: Wallet, iconBg: 'bg-[#EEF3ED]', iconColor: 'text-[#548164]' },
  { icon: TrendingUp, iconBg: 'bg-[#FAF3DD]', iconColor: 'text-[#C29343]' },
  { icon: Banknote, iconBg: 'bg-[#F9F2F5]', iconColor: 'text-[#B35488]' },
]

// Cycles a fixed palette by position so bucket styling stays stable and
// deterministic without needing a dedicated color column in the database.
export function getBucketStyle(index: number) {
  return BUCKET_STYLES[index % BUCKET_STYLES.length]
}
