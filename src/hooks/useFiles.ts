import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Receipt, FileCategory } from '@/types'

export function useFiles() {
  const { user } = useAuth()
  return useQuery<Receipt[]>({
    queryKey: ['files'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Receipt[]
    },
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      category,
      expenseId,
      userId,
    }: {
      file: File
      category: FileCategory
      expenseId?: string
      userId: string
    }) => {
      const ext = file.name.split('.').pop()
      const filename = `${crypto.randomUUID()}.${ext}`
      const storagePath = `${userId}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(storagePath, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(storagePath)

      const { data, error: dbError } = await supabase
        .from('receipts')
        .insert({
          user_id: userId,
          filename: file.name,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          expense_id: expenseId ?? null,
          category,
        })
        .select()
        .single()
      if (dbError) throw dbError
      return data as Receipt
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from('receipts').remove([storagePath])
      const { error } = await supabase.from('receipts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useLinkFileToExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ fileId, expenseId }: { fileId: string; expenseId: string | null }) => {
      const { error } = await supabase
        .from('receipts')
        .update({ expense_id: expenseId })
        .eq('id', fileId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}
