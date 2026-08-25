import { describe, it, expect } from 'vitest'
import { computeBucketSplit, computeReservedRate, getBucketStyle } from './payoutBuckets'
import type { PayoutBucket } from '@/types'

function makeBucket(overrides: Partial<PayoutBucket>): PayoutBucket {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Tax Reserve',
    percentage: 20,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeBucketSplit', () => {
  it('splits fixed-percentage buckets and gives the remainder bucket what is left', () => {
    const buckets = [
      makeBucket({ id: 'tax', name: 'Tax Reserve', percentage: 20, sort_order: 0 }),
      makeBucket({ id: 'savings', name: 'Savings', percentage: 10, sort_order: 1 }),
      makeBucket({ id: 'owner', name: 'Owner Pay', percentage: null, sort_order: 2 }),
    ]

    const result = computeBucketSplit(1000, buckets)

    expect(result.find((r) => r.bucket.id === 'tax')!.amount).toBe(200)
    expect(result.find((r) => r.bucket.id === 'savings')!.amount).toBe(100)
    expect(result.find((r) => r.bucket.id === 'owner')!.amount).toBe(700)
  })

  it('lets the remainder go negative when fixed percentages exceed 100%', () => {
    const buckets = [
      makeBucket({ id: 'a', percentage: 70 }),
      makeBucket({ id: 'b', percentage: 50 }),
      makeBucket({ id: 'remainder', percentage: null }),
    ]

    const result = computeBucketSplit(1000, buckets)

    expect(result.find((r) => r.bucket.id === 'remainder')!.amount).toBe(-200)
  })

  it('gives a single non-remainder bucket its full percentage', () => {
    const buckets = [makeBucket({ percentage: 25 })]
    const result = computeBucketSplit(400, buckets)
    expect(result[0].amount).toBe(100)
  })

  it('gives a single remainder bucket the entire amount', () => {
    const buckets = [makeBucket({ percentage: null })]
    const result = computeBucketSplit(500, buckets)
    expect(result[0].amount).toBe(500)
  })

  it('returns an empty array for no buckets', () => {
    expect(computeBucketSplit(1000, [])).toEqual([])
  })
})

describe('computeReservedRate', () => {
  it('sums every non-remainder bucket percentage', () => {
    const buckets = [
      makeBucket({ percentage: 20 }),
      makeBucket({ percentage: 9 }),
      makeBucket({ percentage: 10 }),
      makeBucket({ percentage: null }),
    ]
    expect(computeReservedRate(buckets)).toBe(39)
  })

  it('returns 0 for an empty or all-remainder list', () => {
    expect(computeReservedRate([])).toBe(0)
    expect(computeReservedRate([makeBucket({ percentage: null })])).toBe(0)
  })
})

describe('getBucketStyle', () => {
  it('cycles the fixed palette deterministically by index', () => {
    expect(getBucketStyle(0)).toBe(getBucketStyle(0))
    expect(getBucketStyle(0)).not.toBe(getBucketStyle(1))
    expect(getBucketStyle(0)).toEqual(getBucketStyle(6))
  })
})
