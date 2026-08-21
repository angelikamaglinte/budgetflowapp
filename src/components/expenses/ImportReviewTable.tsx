import { Fragment } from 'react'
import { AlertTriangle, Briefcase, User, CopyPlus, Split, X } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/types'
import type { ExpenseType } from '@/types'
import { cn } from '@/lib/utils'
import { normalize, splitTotal, isSplitBalanced } from '@/lib/csvImport'
import type { ParsedImportRow, SplitPart } from '@/lib/csvImport'

interface ImportReviewTableProps {
  rows: ParsedImportRow[]
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onToggleAll: (included: boolean) => void
  onToggleSelect: (id: string) => void
  onChangeCategory: (id: string, category: string) => void
  onChangeType: (id: string, type: ExpenseType) => void
  onApplyToSimilar: (id: string) => void
  onStartSplit: (id: string) => void
  onCancelSplit: (id: string) => void
  onUpdateSplitPart: (id: string, partId: string, updates: Partial<SplitPart>) => void
  onAddSplitPart: (id: string) => void
  onRemoveSplitPart: (id: string, partId: string) => void
}

export function ImportReviewTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onToggleSelect,
  onChangeCategory,
  onChangeType,
  onApplyToSimilar,
  onStartSplit,
  onCancelSplit,
  onUpdateSplitPart,
  onAddSplitPart,
  onRemoveSplitPart,
}: ImportReviewTableProps) {
  const allIncluded = rows.every((r) => r.included)
  const someIncluded = rows.some((r) => r.included)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allIncluded}
                  ref={(el) => { if (el) el.indeterminate = someIncluded && !allIncluded }}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="w-4 h-4 accent-primary-600 cursor-pointer"
                  title="Include in import"
                />
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Description</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Category</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Split</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const invalid = !row.date || row.amount === null
              const key = normalize(row.description)
              const differingSiblings = key
                ? rows.filter((r) => r.id !== row.id && normalize(r.description) === key && (r.category !== row.category || r.type !== row.type))
                : []
              const balanced = row.isSplit && isSplitBalanced(row)
              const remaining = row.isSplit && row.amount !== null ? row.amount - splitTotal(row.splitParts) : 0
              return (
                <Fragment key={row.id}>
                <tr
                  className={cn(
                    'border-b border-gray-50 last:border-0',
                    !row.included && 'opacity-40',
                    row.isDuplicate && row.included && 'bg-[#FAF3DD]/50',
                    selectedIds.has(row.id) && 'bg-primary-50/70 ring-1 ring-inset ring-primary-200'
                  )}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={() => onToggleRow(row.id)}
                      disabled={invalid}
                      className="w-4 h-4 accent-primary-600 cursor-pointer"
                      title="Include in import"
                    />
                  </td>
                  <td
                    onClick={() => !row.isSplit && onToggleSelect(row.id)}
                    title={row.isSplit ? undefined : 'Click to select for bulk edit'}
                    className={cn('px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap', !row.isSplit && 'cursor-pointer')}
                  >
                    {row.date ?? <span className="text-red-500 text-xs">Unreadable: "{row.rawDate}"</span>}
                  </td>
                  <td
                    onClick={() => !row.isSplit && onToggleSelect(row.id)}
                    className={cn('px-3 py-2.5 text-sm text-gray-700 max-w-55', !row.isSplit && 'cursor-pointer')}
                  >
                    <div className="truncate" title={row.description}>
                      {row.description}
                      {row.isDuplicate && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#8a6d2f]">
                          <AlertTriangle className="w-3 h-3" /> possible duplicate
                        </span>
                      )}
                    </div>
                    {!invalid && differingSiblings.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onApplyToSimilar(row.id) }}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:underline"
                      >
                        <CopyPlus className="w-3 h-3" /> Apply to {differingSiblings.length} similar
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-900 text-right font-medium whitespace-nowrap">
                    {row.amount !== null ? (
                      `$${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-red-500 text-xs">Unreadable: "{row.rawAmount}"</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={row.category}
                      onChange={(e) => onChangeCategory(row.id, e.target.value)}
                      disabled={invalid || row.isSplit}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
                      <button
                        type="button"
                        disabled={invalid || row.isSplit}
                        onClick={() => onChangeType(row.id, 'business')}
                        title="Business"
                        className={cn(
                          'p-1.5 rounded-md transition-all disabled:opacity-50',
                          row.type === 'business' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400'
                        )}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={invalid || row.isSplit}
                        onClick={() => onChangeType(row.id, 'personal')}
                        title="Personal"
                        className={cn(
                          'p-1.5 rounded-md transition-all disabled:opacity-50',
                          row.type === 'personal' ? 'bg-white text-[#B35488] shadow-sm' : 'text-gray-400'
                        )}
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      disabled={invalid}
                      onClick={() => (row.isSplit ? onCancelSplit(row.id) : onStartSplit(row.id))}
                      title={row.isSplit ? 'Cancel split' : 'Split this transaction'}
                      className={cn(
                        'p-1.5 rounded-md transition-all disabled:opacity-30',
                        row.isSplit ? 'bg-primary-50 text-primary-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Split className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                {row.isSplit && (
                  <tr className={cn('border-b border-gray-50 last:border-0 bg-gray-50/70', !row.included && 'opacity-40')}>
                    <td />
                    <td colSpan={6} className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        {row.splitParts.map((part, i) => (
                          <div key={part.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={part.amount === 0 ? '' : part.amount}
                                onChange={(e) => onUpdateSplitPart(row.id, part.id, { amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-24 pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                              />
                            </div>
                            <select
                              value={part.category}
                              onChange={(e) => onUpdateSplitPart(row.id, part.id, { category: e.target.value })}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                            >
                              {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
                              <button
                                type="button"
                                onClick={() => onUpdateSplitPart(row.id, part.id, { type: 'business' })}
                                title="Business"
                                className={cn(
                                  'p-1.5 rounded-md transition-all',
                                  part.type === 'business' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400'
                                )}
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateSplitPart(row.id, part.id, { type: 'personal' })}
                                title="Personal"
                                className={cn(
                                  'p-1.5 rounded-md transition-all',
                                  part.type === 'personal' ? 'bg-white text-[#B35488] shadow-sm' : 'text-gray-400'
                                )}
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {row.splitParts.length > 2 && (
                              <button
                                type="button"
                                onClick={() => onRemoveSplitPart(row.id, part.id)}
                                title="Remove part"
                                className="text-gray-300 hover:text-red-500 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => onAddSplitPart(row.id)}
                            className="text-xs font-medium text-primary-600 hover:underline"
                          >
                            + Add another part
                          </button>
                          <span className={cn('text-xs font-medium', balanced ? 'text-emerald-600' : 'text-red-600')}>
                            {balanced ? 'Balanced' : `$${Math.abs(remaining).toFixed(2)} ${remaining > 0 ? 'remaining' : 'over'}`}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
