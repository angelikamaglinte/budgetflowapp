import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { RecurringExpense, RecurringExpenseInsert, RecurringExpenseUpdate } from '@/types'

export function useRecurringExpenses() {
  const { user } = useAuth()
  return useQuery<RecurringExpense[]>({
    queryKey: ['recurring_expenses'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('day_of_month', { ascending: true })
      if (error) throw error
      return (data ?? []) as RecurringExpense[]
    },
  })
}

export function useAddRecurringExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: RecurringExpenseInsert) => {
      const { data, error } = await supabase.from('recurring_expenses').insert(item).select().single()
      if (error) throw error
      return data as RecurringExpense
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
    },
  })
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: RecurringExpenseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RecurringExpense
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
    },
  })
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring_expenses'] })
    },
  })
}
