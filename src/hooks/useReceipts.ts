import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Receipt } from '@/types'

export function useReceipts() {
  return useQuery<Receipt[]>({
    queryKey: ['receipts'],
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

export function useUploadReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      expenseId,
      userId,
    }: {
      file: File
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
          filename: file.name,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          expense_id: expenseId ?? null,
        })
        .select()
        .single()
      if (dbError) throw dbError
      return data as Receipt
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from('receipts').remove([storagePath])
      const { error } = await supabase.from('receipts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })
}

export function useLinkReceiptToExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ receiptId, expenseId }: { receiptId: string; expenseId: string | null }) => {
      const { error } = await supabase
        .from('receipts')
        .update({ expense_id: expenseId })
        .eq('id', receiptId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })
}
