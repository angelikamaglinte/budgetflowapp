import type { Expense, ExpenseCategory, ExpenseType } from '@/types'

export interface SplitPart {
  id: string
  amount: number
  category: string
  type: ExpenseType
}

export interface ParsedImportRow {
  id: string
  date: string | null // 'yyyy-MM-dd', null if unparseable
  rawDate: string
  description: string
  amount: number | null // always positive once parsed, null if unparseable
  rawAmount: string
  category: string
  type: ExpenseType
  isDuplicate: boolean
  included: boolean
  isSplit: boolean
  splitParts: SplitPart[] // only meaningful when isSplit is true
}

export function splitTotal(parts: SplitPart[]): number {
  return parts.reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0)
}

export function isSplitBalanced(row: Pick<ParsedImportRow, 'amount' | 'splitParts'>): boolean {
  if (row.amount === null) return false
  return Math.abs(splitTotal(row.splitParts) - row.amount) < 0.005
}

// Tries a handful of common bank-export date formats before giving up.
export function parseFlexibleDate(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  // YYYY-MM-DD or YYYY/MM/DD
  let m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) return toIsoDate(Number(m[1]), Number(m[2]), Number(m[3]))

  // MM/DD/YYYY or MM-DD-YYYY (US bank default)
  m = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (m) return toIsoDate(Number(m[3]), Number(m[1]), Number(m[2]))

  // MM/DD/YY
  m = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/)
  if (m) return toIsoDate(2000 + Number(m[3]), Number(m[1]), Number(m[2]))

  // Fallback: let the browser try (handles "Aug 15, 2026" etc.)
  const parsed = new Date(value)
  if (!isNaN(parsed.getTime())) {
    return toIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
  }

  return null
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Strips currency symbols/commas, handles "(12.34)" as negative. Returns the
// signed number — callers decide what a positive vs. negative amount means
// for their particular bank export.
export function parseFlexibleAmount(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const isParenNegative = /^\(.*\)$/.test(trimmed)
  const cleaned = trimmed.replace(/[()$,\s]/g, '')
  const value = parseFloat(cleaned)
  if (isNaN(value)) return null
  return isParenNegative ? -Math.abs(value) : value
}

// Builds a lookup of "vendor/title text" -> most common category+type from
// the user's own expense history, so imported transactions can be
// pre-categorized instead of landing as blank.
export function buildCategorySuggester(existingExpenses: Expense[]) {
  const counts = new Map<string, Map<string, { category: string; type: ExpenseType; count: number }>>()

  for (const exp of existingExpenses) {
    const keys = [exp.vendor, exp.title].filter(Boolean).map((s) => normalize(s as string))
    for (const key of keys) {
      if (!key) continue
      if (!counts.has(key)) counts.set(key, new Map())
      const byCategory = counts.get(key)!
      const comboKey = `${exp.category}::${exp.type}`
      const existing = byCategory.get(comboKey)
      byCategory.set(comboKey, {
        category: exp.category,
        type: exp.type as ExpenseType,
        count: (existing?.count ?? 0) + 1,
      })
    }
  }

  return function suggest(description: string): { category: string; type: ExpenseType } | null {
    const normalizedDesc = normalize(description)
    if (!normalizedDesc) return null

    let best: { category: string; type: ExpenseType; count: number } | null = null
    for (const [key, byCategory] of counts) {
      if (!normalizedDesc.includes(key) && !key.includes(normalizedDesc)) continue
      for (const combo of byCategory.values()) {
        if (!best || combo.count > best.count) best = combo
      }
    }
    return best ? { category: best.category, type: best.type } : null
  }
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Flags a parsed row as a likely duplicate if an existing expense shares the
// same date and amount (bank descriptions rarely match exactly, so date+amount
// is the more reliable signal).
export function isLikelyDuplicate(row: { date: string | null; amount: number | null }, existingExpenses: Expense[]): boolean {
  if (!row.date || row.amount === null) return false
  return existingExpenses.some((exp) => exp.date === row.date && Math.abs(exp.amount - row.amount!) < 0.005)
}

export const DEFAULT_IMPORT_CATEGORY: ExpenseCategory = 'Other'

// Many bank exports (especially Canadian ones) have no header row at all and
// just start with data. If the first row's cells parse as real dates/amounts,
// treat it as data rather than column labels.
export function isLikelyDataRow(row: string[]): boolean {
  return row.some((cell) => {
    const trimmed = (cell ?? '').trim()
    if (!trimmed) return false
    return parseFlexibleDate(trimmed) !== null || parseFlexibleAmount(trimmed) !== null
  })
}

export function deriveHeadersAndRows(
  rawRows: string[][],
  hasHeaderRow: boolean
): { headers: string[]; rows: Record<string, string>[] } {
  const width = rawRows.reduce((max, r) => Math.max(max, r.length), 0)
  const headerRow = hasHeaderRow ? rawRows[0] : null
  const headers = Array.from({ length: width }, (_, i) => headerRow?.[i]?.trim() || `Column ${i + 1}`)
  const dataRows = hasHeaderRow ? rawRows.slice(1) : rawRows
  const rows = dataRows.map((r) => {
    const record: Record<string, string> = {}
    headers.forEach((h, i) => { record[h] = r[i] ?? '' })
    return record
  })
  return { headers, rows }
}
