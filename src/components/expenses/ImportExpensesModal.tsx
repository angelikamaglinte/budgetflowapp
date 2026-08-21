import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Upload, X, ChevronLeft, AlertCircle, Briefcase, User, MoreHorizontal } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  parseFlexibleDate,
  parseFlexibleAmount,
  buildCategorySuggester,
  isLikelyDuplicate,
  isLikelyDataRow,
  deriveHeadersAndRows,
  normalize,
  isSplitBalanced,
  DEFAULT_IMPORT_CATEGORY,
} from '@/lib/csvImport'
import type { ParsedImportRow, SplitPart } from '@/lib/csvImport'
import { ImportReviewTable } from './ImportReviewTable'
import { EXPENSE_CATEGORIES } from '@/types'
import type { Expense, ExpenseInsert, ExpenseType } from '@/types'

type Step = 'upload' | 'mapping' | 'review'
type Sign = 'positive' | 'negative'
type AmountMode = 'single' | 'split'

interface ImportExpensesModalProps {
  open: boolean
  onClose: () => void
  existingExpenses: Expense[]
  onImport: (expenses: ExpenseInsert[]) => Promise<void>
}

export function ImportExpensesModal({ open, onClose, existingExpenses, onImport }: ImportExpensesModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')

  const [rawRows, setRawRows] = useState<string[][]>([])
  const [hasHeaderRow, setHasHeaderRow] = useState(true)

  const [dateColumn, setDateColumn] = useState('')
  const [descColumn, setDescColumn] = useState('')
  const [amountMode, setAmountMode] = useState<AmountMode>('single')
  const [amountColumn, setAmountColumn] = useState('')
  const [expenseSign, setExpenseSign] = useState<Sign>('positive')
  const [debitColumn, setDebitColumn] = useState('')
  const [creditColumn, setCreditColumn] = useState('')

  const [rows, setRows] = useState<ParsedImportRow[]>([])
  const [skippedCount, setSkippedCount] = useState(0)
  const [importing, setImporting] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { headers: csvHeaders, rows: csvRows } = useMemo(
    () => deriveHeadersAndRows(rawRows, hasHeaderRow),
    [rawRows, hasHeaderRow]
  )

  function reset() {
    setStep('upload')
    setError(null)
    setFileName('')
    setRawRows([])
    setHasHeaderRow(true)
    setDateColumn('')
    setDescColumn('')
    setAmountMode('single')
    setAmountColumn('')
    setExpenseSign('positive')
    setDebitColumn('')
    setCreditColumn('')
    setRows([])
    setSkippedCount(0)
    setSelectedIds(new Set())
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(file: File) {
    setError(null)
    setFileName(file.name)
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data.filter((r) => r.length > 0)
        if (parsedRows.length === 0) {
          setError("Couldn't find any rows in that file.")
          return
        }

        const headerPresent = !isLikelyDataRow(parsedRows[0])
        const { headers } = deriveHeadersAndRows(parsedRows, headerPresent)

        setRawRows(parsedRows)
        setHasHeaderRow(headerPresent)

        setDateColumn(headers.find((h) => /date/i.test(h)) ?? headers[0])
        setDescColumn(headers.find((h) => /desc|memo|payee|merchant|name/i.test(h)) ?? headers[1] ?? headers[0])

        const debitGuess = headers.find((h) => /debit|withdraw/i.test(h))
        const creditGuess = headers.find((h) => /credit|deposit/i.test(h))

        if (debitGuess && creditGuess) {
          setAmountMode('split')
          setDebitColumn(debitGuess)
          setCreditColumn(creditGuess)
        } else if (!headerPresent && headers.length === 5) {
          // Common headerless bank export: Date, Description, Debit, Credit, Balance
          setAmountMode('split')
          setDebitColumn(headers[2])
          setCreditColumn(headers[3])
        } else {
          setAmountMode('single')
          setAmountColumn(headers.find((h) => /amount|debit|charge/i.test(h)) ?? headers[headers.length - 1])
        }
        // Reasonable fallbacks in case the user switches modes manually.
        setDebitColumn((prev) => prev || headers[2] || headers[0])
        setCreditColumn((prev) => prev || headers[3] || headers[1] || headers[0])
        setAmountColumn((prev) => prev || headers[headers.length - 1])

        setStep('mapping')
      },
      error: (err) => setError(err.message),
    })
  }

  function buildRows() {
    const suggest = buildCategorySuggester(existingExpenses)
    const seenInFile = new Set<string>()
    const visible: ParsedImportRow[] = []
    let skipped = 0

    csvRows.forEach((raw, i) => {
      const rawDate = String(raw[dateColumn] ?? '')
      const description = String(raw[descColumn] ?? '').trim() || '(no description)'
      const date = parseFlexibleDate(rawDate)

      let amount: number | null = null
      let rawAmount = ''
      let isExpenseRow = false
      let hasParseError = date === null

      if (amountMode === 'single') {
        rawAmount = String(raw[amountColumn] ?? '')
        const signedAmount = parseFlexibleAmount(rawAmount)
        hasParseError = hasParseError || signedAmount === null
        isExpenseRow = signedAmount !== null && (expenseSign === 'positive' ? signedAmount > 0 : signedAmount < 0)
        amount = signedAmount !== null ? Math.abs(signedAmount) : null
      } else {
        const debitStr = String(raw[debitColumn] ?? '').trim()
        const creditStr = String(raw[creditColumn] ?? '').trim()
        const debitValue = debitStr ? parseFlexibleAmount(debitStr) : null
        const creditValue = creditStr ? parseFlexibleAmount(creditStr) : null
        rawAmount = debitStr || creditStr

        if (debitValue) {
          amount = Math.abs(debitValue)
          isExpenseRow = true
        } else if (creditValue) {
          amount = Math.abs(creditValue)
          isExpenseRow = false
        } else {
          hasParseError = true
        }
      }

      // Rows that parsed fine but represent the other side of the ledger
      // (deposits, refunds) are excluded rather than shown as unchecked —
      // keeps the review table focused on actual expense candidates.
      if (!hasParseError && !isExpenseRow) {
        skipped += 1
        return
      }

      const dedupeKey = date && amount !== null ? `${date}|${amount.toFixed(2)}` : null
      const dupInFile = dedupeKey ? seenInFile.has(dedupeKey) : false
      if (dedupeKey) seenInFile.add(dedupeKey)
      const isDuplicate = dupInFile || isLikelyDuplicate({ date, amount }, existingExpenses)

      const suggestion = suggest(description)

      visible.push({
        id: `row-${i}`,
        date,
        rawDate,
        description,
        amount,
        rawAmount,
        category: suggestion?.category ?? DEFAULT_IMPORT_CATEGORY,
        type: suggestion?.type ?? 'business',
        isDuplicate,
        included: !hasParseError && !isDuplicate,
        isSplit: false,
        splitParts: [],
      })
    })

    setRows(visible)
    setSkippedCount(skipped)
    setStep('review')
  }

  function toggleRow(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, included: !r.included } : r)))
  }
  function toggleAll(included: boolean) {
    setRows((prev) => prev.map((r) => (r.date && r.amount !== null ? { ...r, included } : r)))
  }
  function changeCategory(id: string, category: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, category } : r)))
  }
  function changeType(id: string, type: ExpenseType) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, type } : r)))
  }

  // Explicit, opt-in bulk-apply — not automatic, since the same vendor (e.g.
  // a general store) can legitimately be personal sometimes and business
  // other times. You choose when a correction should spread to lookalikes.
  function applyToSimilar(id: string) {
    setRows((prev) => {
      const source = prev.find((r) => r.id === id)
      if (!source) return prev
      const key = normalize(source.description)
      return prev.map((r) =>
        r.id !== id && normalize(r.description) === key
          ? { ...r, category: source.category, type: source.type }
          : r
      )
    })
  }

  // Bulk edit — check off a batch of rows (e.g. every "WU TRANSFER" row)
  // and apply one category/type change to all of them at once via the
  // actions menu, instead of clicking through each row's dropdown.
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll(selected: boolean) {
    setSelectedIds(selected ? new Set(rows.filter((r) => !r.isSplit).map((r) => r.id)) : new Set())
  }
  function applyBulkCategory(category: string) {
    if (selectedIds.size === 0) return
    setRows((prev) => prev.map((r) => (selectedIds.has(r.id) && !r.isSplit ? { ...r, category } : r)))
    setSelectedIds(new Set())
  }
  function applyBulkType(type: ExpenseType) {
    if (selectedIds.size === 0) return
    setRows((prev) => prev.map((r) => (selectedIds.has(r.id) && !r.isSplit ? { ...r, type } : r)))
    setSelectedIds(new Set())
  }

  // Splitting handles the case where one bank transaction is really part
  // business, part personal (e.g. a shared card at a general store). The
  // main row stays a single included/excluded unit; its parts just decide
  // how it's broken into multiple expense records on import.
  function startSplit(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id || r.amount === null) return r
        const secondType: ExpenseType = r.type === 'business' ? 'personal' : 'business'
        return {
          ...r,
          isSplit: true,
          splitParts: [
            { id: crypto.randomUUID(), amount: r.amount, category: r.category, type: r.type },
            { id: crypto.randomUUID(), amount: 0, category: r.category, type: secondType },
          ],
        }
      })
    )
  }
  function cancelSplit(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isSplit: false, splitParts: [] } : r)))
  }
  function updateSplitPart(id: string, partId: string, updates: Partial<SplitPart>) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, splitParts: r.splitParts.map((p) => (p.id === partId ? { ...p, ...updates } : p)) }
          : r
      )
    )
  }
  function addSplitPart(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, splitParts: [...r.splitParts, { id: crypto.randomUUID(), amount: 0, category: r.category, type: 'business' }] }
          : r
      )
    )
  }
  function removeSplitPart(id: string, partId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id && r.splitParts.length > 2 ? { ...r, splitParts: r.splitParts.filter((p) => p.id !== partId) } : r
      )
    )
  }

  const includedRows = rows.filter((r) => r.included && r.date && r.amount !== null)
  const includedTotal = includedRows.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const resultingCount = includedRows.reduce((sum, r) => sum + (r.isSplit ? r.splitParts.length : 1), 0)
  const hasUnbalancedSplit = includedRows.some((r) => r.isSplit && !isSplitBalanced(r))

  async function handleImport() {
    setImporting(true)
    try {
      const payload: ExpenseInsert[] = includedRows.flatMap((r) => {
        if (r.isSplit && r.splitParts.length > 0) {
          return r.splitParts.map((part, i) => ({
            date: r.date!,
            title: `${r.description} (${i + 1}/${r.splitParts.length})`,
            vendor: r.description,
            category: part.category,
            type: part.type,
            amount: part.amount,
          }))
        }
        return [
          {
            date: r.date!,
            title: r.description,
            vendor: r.description,
            category: r.category,
            type: r.type,
            amount: r.amount!,
          },
        ]
      })
      await onImport(payload)
      handleClose()
    } finally {
      setImporting(false)
    }
  }

  const previewRows = csvRows.slice(0, 3)
  const mappingReady = amountMode === 'single' ? !!(dateColumn && descColumn && amountColumn) : !!(dateColumn && descColumn && debitColumn)

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Import Expenses{fileName && step !== 'upload' ? ` — ${fileName}` : ''}
        </h2>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Export a transaction CSV from your bank or credit card, then upload it here.
              We'll walk you through matching the columns before anything is saved.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
            >
              Choose CSV File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="flex flex-col gap-5">
            <label className="flex items-center gap-2 text-sm text-gray-600 w-fit cursor-pointer">
              <input
                type="checkbox"
                checked={hasHeaderRow}
                onChange={(e) => setHasHeaderRow(e.target.checked)}
                className="w-4 h-4 accent-primary-600 cursor-pointer"
              />
              This file's first row is a column header
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date column</label>
                <select
                  value={dateColumn}
                  onChange={(e) => setDateColumn(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description column</label>
                <select
                  value={descColumn}
                  onChange={(e) => setDescColumn(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount format</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-3">
                <button
                  type="button"
                  onClick={() => setAmountMode('single')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    amountMode === 'single' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  )}
                >
                  One amount column
                </button>
                <button
                  type="button"
                  onClick={() => setAmountMode('split')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    amountMode === 'split' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  )}
                >
                  Separate Debit & Credit columns
                </button>
              </div>

              {amountMode === 'single' ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount column</label>
                    <select
                      value={amountColumn}
                      onChange={(e) => setAmountColumn(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Spending appears as</label>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setExpenseSign('positive')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                          expenseSign === 'positive' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                        )}
                      >
                        Positive
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseSign('negative')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                          expenseSign === 'negative' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                        )}
                      >
                        Negative
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Debit column (spending)</label>
                    <select
                      value={debitColumn}
                      onChange={(e) => setDebitColumn(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Credit column (deposits — ignored)</label>
                    <select
                      value={creditColumn}
                      onChange={(e) => setCreditColumn(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{parseFlexibleDate(String(r[dateColumn] ?? '')) ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-700 truncate max-w-50">{String(r[descColumn] ?? '')}</td>
                        <td className="px-3 py-2 text-gray-900 text-right whitespace-nowrap">
                          {amountMode === 'single'
                            ? String(r[amountColumn] ?? '')
                            : (String(r[debitColumn] ?? '').trim() ? `-${String(r[debitColumn])}` : `+${String(r[creditColumn] ?? '')}`)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={buildRows}
                disabled={!mappingReady}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              {rows.length} transaction{rows.length === 1 ? '' : 's'} found
              {skippedCount > 0 && ` (${skippedCount} excluded as deposits/refunds, not expenses)`}.
              Uncheck anything you don't want — like e-transfers or internal transfers — and adjust category or type as needed.
            </p>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 bg-primary-50 border border-primary-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary-800">{selectedIds.size} selected</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition"
                      />
                    }
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Change category</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <DropdownMenuItem
                            key={cat}
                            render={
                              <button
                                type="button"
                                onClick={() => applyBulkCategory(cat)}
                                className="flex w-full cursor-pointer items-center"
                              />
                            }
                          >
                            {cat}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      render={
                        <button
                          type="button"
                          onClick={() => applyBulkType('business')}
                          className="flex w-full cursor-pointer items-center gap-1.5"
                        />
                      }
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Update to Business expense
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <button
                          type="button"
                          onClick={() => applyBulkType('personal')}
                          className="flex w-full cursor-pointer items-center gap-1.5"
                        />
                      }
                    >
                      <User className="w-3.5 h-3.5" /> Update to Personal expense
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <ImportReviewTable
              rows={rows}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onChangeCategory={changeCategory}
              onChangeType={changeType}
              onApplyToSimilar={applyToSimilar}
              onStartSplit={startSplit}
              onCancelSplit={cancelSplit}
              onUpdateSplitPart={updateSplitPart}
              onAddSplitPart={addSplitPart}
              onRemoveSplitPart={removeSplitPart}
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{includedRows.length}</span> selected ·{' '}
                <span className="font-semibold text-gray-900">
                  ${includedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </p>
              {hasUnbalancedSplit && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" /> Finish splitting before importing
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => void handleImport()}
                disabled={includedRows.length === 0 || importing || hasUnbalancedSplit}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition"
              >
                {importing ? 'Importing...' : `Import ${resultingCount} Expense${resultingCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
