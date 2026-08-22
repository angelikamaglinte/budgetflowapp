import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAddExpense } from './useExpenses'

// vi.mock factories are hoisted above regular imports/consts, so anything
// they need has to be declared via vi.hoisted rather than a plain const.
const { insertedExpense } = vi.hoisted(() => ({
  insertedExpense: { id: '1', title: 'Adobe Creative Cloud', category: 'Software', type: 'business', amount: 54.99 },
}))

vi.mock('@/lib/supabase', () => {
  const builder = {
    insert: vi.fn(function (this: unknown) { return this }),
    select: vi.fn(function (this: unknown) { return this }),
    single: vi.fn(() => Promise.resolve({ data: insertedExpense, error: null })),
  }
  return { supabase: { from: vi.fn(() => builder) } }
})

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useAddExpense (integration)', () => {
  it('inserts through Supabase and returns the saved row', async () => {
    const { result } = renderHook(() => useAddExpense(), { wrapper: Wrapper })

    result.current.mutate({
      date: '2026-08-20',
      title: 'Adobe Creative Cloud',
      category: 'Software',
      type: 'business',
      amount: 54.99,
      user_id: 'test-user',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(insertedExpense)
  })
})
