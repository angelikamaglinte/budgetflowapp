import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PurchasePlan, PurchasePlanInsert, PurchasePlanUpdate } from '@/types'

export function usePurchasePlans() {
  const { user } = useAuth()
  return useQuery<PurchasePlan[]>({
    queryKey: ['purchase_plans'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_plans')
        .select('*')
        .order('target_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as PurchasePlan[]
    },
  })
}

export function useAddPurchasePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (plan: PurchasePlanInsert) => {
      const { data, error } = await supabase.from('purchase_plans').insert(plan).select().single()
      if (error) throw error
      return data as PurchasePlan
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['purchase_plans'] })
    },
  })
}

export function useUpdatePurchasePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: PurchasePlanUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('purchase_plans')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PurchasePlan
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['purchase_plans'] })
    },
  })
}

export function useDeletePurchasePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['purchase_plans'] })
    },
  })
}
