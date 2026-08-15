import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { BusinessProfile, BusinessProfileInsert } from '@/types'

export function useBusinessProfile() {
  const { user } = useAuth()
  return useQuery<BusinessProfile | null>({
    queryKey: ['business_profile'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('business_profiles').select('*').maybeSingle()
      if (error) throw error
      return data as BusinessProfile | null
    },
  })
}

export function useSaveBusinessProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profile: BusinessProfileInsert) => {
      const { data, error } = await supabase
        .from('business_profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) throw error
      return data as BusinessProfile
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['business_profile'] })
    },
  })
}
