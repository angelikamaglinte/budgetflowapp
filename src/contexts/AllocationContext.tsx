import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AllocationContextValue {
  taxRate: number
  savingsRate: number
  setTaxRate: (rate: number) => void
  setSavingsRate: (rate: number) => void
}

const AllocationContext = createContext<AllocationContextValue>({
  taxRate: 20,
  savingsRate: 10,
  setTaxRate: () => {},
  setSavingsRate: () => {},
})

export function AllocationProvider({ children }: { children: ReactNode }) {
  const [taxRate, setTaxRateState] = useState(() => {
    const stored = localStorage.getItem('alloc_taxRate')
    return stored ? Number(stored) : 20
  })
  const [savingsRate, setSavingsRateState] = useState(() => {
    const stored = localStorage.getItem('alloc_savingsRate')
    return stored ? Number(stored) : 10
  })

  function setTaxRate(rate: number) {
    setTaxRateState(rate)
    localStorage.setItem('alloc_taxRate', String(rate))
  }

  function setSavingsRate(rate: number) {
    setSavingsRateState(rate)
    localStorage.setItem('alloc_savingsRate', String(rate))
  }

  return (
    <AllocationContext.Provider value={{ taxRate, savingsRate, setTaxRate, setSavingsRate }}>
      {children}
    </AllocationContext.Provider>
  )
}

export function useAllocation() {
  return useContext(AllocationContext)
}
