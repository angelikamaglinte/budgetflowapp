import { describe, it, expect } from 'vitest'
import { getEffectiveStatus } from './invoiceStatus'

describe('getEffectiveStatus', () => {
  const today = new Date('2026-08-20T12:00:00')

  it('returns overdue for a pending invoice past its due date', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: '2026-08-01' }, today)).toBe('overdue')
  })

  it('returns pending for a pending invoice due today', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: '2026-08-20' }, today)).toBe('pending')
  })

  it('returns pending for a pending invoice due in the future', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: '2026-09-01' }, today)).toBe('pending')
  })

  it('returns pending for a pending invoice with no due date', () => {
    expect(getEffectiveStatus({ status: 'pending', due_date: null }, today)).toBe('pending')
  })

  it('never overrides a paid invoice, even if the due date has passed', () => {
    expect(getEffectiveStatus({ status: 'paid', due_date: '2026-01-01' }, today)).toBe('paid')
  })
})
