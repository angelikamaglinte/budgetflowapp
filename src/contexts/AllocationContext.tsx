import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface AllocationContextValue {
  taxRate: number
  savingsRate: number
  setTaxRate: (rate: number) => void
  setSavingsRate: (rate: number) => void
  refresh: () => Promise<void>
}

const DEFAULT_TAX_RATE = 20
const DEFAULT_SAVINGS_RATE = 10

const AllocationContext = createContext<AllocationContextValue>({
  taxRate: DEFAULT_TAX_RATE,
  savingsRate: DEFAULT_SAVINGS_RATE,
  setTaxRate: () => {},
  setSavingsRate: () => {},
  refresh: async () => {},
})

export function AllocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [taxRate, setTaxRateState] = useState(DEFAULT_TAX_RATE)
  const [savingsRate, setSavingsRateState] = useState(DEFAULT_SAVINGS_RATE)

  async function fetchRates() {
    if (!user) return
    const { data } = await supabase.from('business_profiles').select('tax_rate, savings_rate').maybeSingle()
    if (data) {
      setTaxRateState(data.tax_rate)
      setSavingsRateState(data.savings_rate)
    }
  }

  useEffect(() => {
    void fetchRates()
  }, [user])

  async function persist(nextTaxRate: number, nextSavingsRate: number) {
    if (!user) return
    await supabase
      .from('business_profiles')
      .upsert({ user_id: user.id, tax_rate: nextTaxRate, savings_rate: nextSavingsRate }, { onConflict: 'user_id' })
  }

  function setTaxRate(rate: number) {
    setTaxRateState(rate)
    void persist(rate, savingsRate)
  }

  function setSavingsRate(rate: number) {
    setSavingsRateState(rate)
    void persist(taxRate, rate)
  }

  return (
    <AllocationContext.Provider value={{ taxRate, savingsRate, setTaxRate, setSavingsRate, refresh: fetchRates }}>
      {children}
    </AllocationContext.Provider>
  )
}

export function useAllocation() {
  return useContext(AllocationContext)
}
