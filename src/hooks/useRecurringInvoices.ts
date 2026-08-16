import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { RecurringInvoice, RecurringInvoiceInsert, RecurringInvoiceUpdate } from '@/types'

export function useRecurringInvoices() {
  const { user } = useAuth()
  return useQuery<RecurringInvoice[]>({
    queryKey: ['recurring_invoices'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*')
        .order('day_of_month', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as RecurringInvoice[]
    },
  })
}

export function useAddRecurringInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: RecurringInvoiceInsert) => {
      const { data, error } = await supabase.from('recurring_invoices').insert(item).select().single()
      if (error) throw error
      return data as unknown as RecurringInvoice
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] })
    },
  })
}

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: RecurringInvoiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as RecurringInvoice
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] })
    },
  })
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] })
    },
  })
}
