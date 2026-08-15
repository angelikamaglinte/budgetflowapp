import type { PdfLineItem } from '@/types'

export function lineItemAmount(item: PdfLineItem): number {
  return item.qty * item.rate
}

export function computeSubtotal(items: PdfLineItem[]): number {
  return items.reduce((sum, item) => sum + lineItemAmount(item), 0)
}

export function computeTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100)
}

export function computeTotal(subtotal: number, tax: number): number {
  return subtotal + tax
}

export function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
