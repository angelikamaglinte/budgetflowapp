import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PayoutBucket, PayoutBucketInsert, PayoutBucketUpdate } from '@/types'

export function usePayoutBuckets() {
  const { user } = useAuth()
  return useQuery<PayoutBucket[]>({
    queryKey: ['payout-buckets'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_buckets')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as PayoutBucket[]
    },
  })
}

export function useAddBucket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bucket: PayoutBucketInsert) => {
      const { data, error } = await supabase.from('payout_buckets').insert(bucket).select().single()
      if (error) throw error
      return data as PayoutBucket
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payout-buckets'] })
    },
  })
}

export function useUpdateBucket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: PayoutBucketUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('payout_buckets')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PayoutBucket
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payout-buckets'] })
    },
  })
}

export function useDeleteBucket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payout_buckets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payout-buckets'] })
    },
  })
}
