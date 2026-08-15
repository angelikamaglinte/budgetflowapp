import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PdfInvoice, PdfInvoiceInsert, PdfInvoiceUpdate } from '@/types'

export function usePdfInvoices() {
  const { user } = useAuth()
  return useQuery<PdfInvoice[]>({
    queryKey: ['pdf_invoices'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_invoices')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as PdfInvoice[]
    },
  })
}

export function useAddPdfInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoice: PdfInvoiceInsert) => {
      const { data, error } = await supabase.from('pdf_invoices').insert(invoice).select().single()
      if (error) throw error
      return data as unknown as PdfInvoice
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pdf_invoices'] })
    },
  })
}

export function useUpdatePdfInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: PdfInvoiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('pdf_invoices')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as PdfInvoice
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pdf_invoices'] })
    },
  })
}

export function useDeletePdfInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pdf_invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pdf_invoices'] })
    },
  })
}
