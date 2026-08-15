import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { periodKey } from '@/lib/reminders'
import type { InvoiceReminder, InvoiceReminderInsert, InvoiceReminderUpdate } from '@/types'

export function useInvoiceReminders() {
  const { user } = useAuth()
  return useQuery<InvoiceReminder[]>({
    queryKey: ['invoice_reminders'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_reminders')
        .select('*')
        .order('reminder_day', { ascending: true })
      if (error) throw error
      return (data ?? []) as InvoiceReminder[]
    },
  })
}

export function useAddInvoiceReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reminder: InvoiceReminderInsert) => {
      const { data, error } = await supabase.from('invoice_reminders').insert(reminder).select().single()
      if (error) throw error
      return data as InvoiceReminder
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoice_reminders'] })
    },
  })
}

export function useUpdateInvoiceReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: InvoiceReminderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('invoice_reminders')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as InvoiceReminder
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoice_reminders'] })
    },
  })
}

export function useDeleteInvoiceReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoice_reminders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoice_reminders'] })
    },
  })
}

export function useDismissInvoiceReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoice_reminders')
        .update({ dismissed_period: periodKey(new Date()) })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoice_reminders'] })
    },
  })
}
