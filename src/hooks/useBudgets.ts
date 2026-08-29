import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { BudgetCategory, BudgetCategoryInsert, BudgetCategoryUpdate } from '@/types'

export function useBudgets() {
  const { user } = useAuth()
  return useQuery<BudgetCategory[]>({
    queryKey: ['budget-categories'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as BudgetCategory[]
    },
  })
}

export function useAddBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (budget: BudgetCategoryInsert) => {
      const { data, error } = await supabase.from('budget_categories').insert(budget).select().single()
      if (error) throw error
      return data as BudgetCategory
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: BudgetCategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('budget_categories')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as BudgetCategory
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
    },
  })
}
