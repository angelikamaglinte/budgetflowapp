import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, TrendingUp, Landmark, MapPin, ShieldCheck, Receipt, Wallet, AlertCircle, CalendarClock, ArrowLeftRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { useInvoices } from '@/hooks/useInvoices'
import { useExpenses } from '@/hooks/useExpenses'
import { useBusinessProfile, useSaveBusinessProfile } from '@/hooks/useBusinessProfile'
import { useAuth } from '@/contexts/AuthContext'
import { computeAnnualNetIncome, computeGstSummary, computeTaxSummary, computeKeyDates, daysUntil, PROVINCE_LABELS } from '@/lib/canadianTax'
import type { ProvinceCode } from '@/lib/canadianTax'
import { formatMoney } from '@/lib/savingsCalculator'

function formatPercent(n: number) {
  return n.toFixed(1) + '%'
}

function formatDaysLabel(days: number) {
  if (days < 0) return 'Passed'
  if (days === 0) return 'Today'
  return `${days} day${days === 1 ? '' : 's'} away`
}

export default function Tax() {
  const { user } = useAuth()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile()
  const saveProfile = useSaveBusinessProfile()

  const province = (profile?.province as ProvinceCode | null) ?? null

  const tuitionCreditAvailable = profile?.tuition_credit_remaining ?? 0

  const income = useMemo(() => computeAnnualNetIncome(invoices, expenses, year), [invoices, expenses, year])
  const summary = useMemo(
    () => computeTaxSummary(income.netIncome, province, tuitionCreditAvailable),
    [income.netIncome, province, tuitionCreditAvailable]
  )
  const keyDates = useMemo(() => computeKeyDates(year, summary.totalOwing), [year, summary.totalOwing])
  const gstSummary = useMemo(() => computeGstSummary(invoices, expenses, year), [invoices, expenses, year])

  function handleProvinceChange(value: string) {
    if (!user) return
    void saveProfile.mutateAsync({ user_id: user.id, province: value || null })
  }

  const isLoading = loadingInv || loadingExp || loadingProfile

  return (
    <AppLayout title="Tax" subtitle="Estimated federal, provincial, and CPP for the year" showPeriodSelector={false}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 w-12 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="tax-province" className="text-sm text-gray-500">Province</label>
          <select
            id="tax-province"
            value={province ?? ''}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select province</option>
            {(Object.keys(PROVINCE_LABELS) as ProvinceCode[]).map((code) => (
              <option key={code} value={code}>{PROVINCE_LABELS[code]}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Based on {formatMoney(income.grossIncome)} in paid invoices minus {formatMoney(income.businessExpenses)} in
        business expenses — an estimate using {year === new Date().getFullYear() ? 'current' : `${year}`} CRA rates,
        not tax advice.
        {province === 'QC' && ' Quebec has its own abatement and credit system that this simplifies away — treat the provincial figure as a rough guide only.'}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {!province && (
            <div className="flex items-start gap-2 bg-[#FAF3DD] text-[#C29343] text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Select your province above to include provincial income tax in this estimate.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
            <StatCard
              label="Net Self-Employment Income"
              value={income.netIncome}
              icon={<TrendingUp className="w-5 h-5 text-[#548164]" />}
              iconBg="bg-[#EEF3ED]"
            />
            <StatCard
              label="Federal Tax"
              value={summary.federalTax}
              delay={0.05}
              icon={<Landmark className="w-5 h-5 text-[#C4554D]" />}
              iconBg="bg-[#FAECEC]"
            />
            <StatCard
              label="Provincial Tax"
              value={summary.provincialTax}
              delay={0.1}
              icon={<MapPin className="w-5 h-5 text-[#487CA5]" />}
              iconBg="bg-[#E9F3F7]"
            />
            <StatCard
              label="CPP Contribution"
              value={summary.cpp.total}
              delay={0.15}
              icon={<ShieldCheck className="w-5 h-5 text-[#8A67AB]" />}
              iconBg="bg-[#F6F3F8]"
            />
            <StatCard
              label="Total Estimated Owing"
              value={summary.totalOwing}
              delay={0.2}
              icon={<Receipt className="w-5 h-5 text-[#C29343]" />}
              iconBg="bg-[#FAF3DD]"
            />
            <StatCard
              label={`After-Tax Income (${formatPercent(100 - summary.effectiveRate)} kept)`}
              value={summary.afterTaxIncome}
              delay={0.25}
              glow
              icon={<Wallet className="w-5 h-5 text-[#B35488]" />}
              iconBg="bg-[#F9F2F5]"
            />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            CPP breakdown: {formatMoney(summary.cpp.base)} base contribution
            {summary.cpp.cpp2 > 0 && ` + ${formatMoney(summary.cpp.cpp2)} CPP2`} — self-employed contributors pay
            both the employee and employer portions.
          </p>

          {tuitionCreditAvailable > 0 && (
            <p className="text-xs text-gray-400 mt-1 mb-6">
              Tuition credit applied: {formatMoney(summary.tuitionCreditUsed)} of {formatMoney(tuitionCreditAvailable)}{' '}
              available — ~{formatMoney(summary.remainingTuitionCredit)} would remain for next year. Update this
              from your next Notice of Assessment in Settings — this app doesn't track usage automatically.
            </p>
          )}
          {tuitionCreditAvailable <= 0 && <div className="mb-6" />}

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Key Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-[#FAECEC] rounded-xl">
                <Receipt className="w-4 h-4 text-[#C4554D] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Balance Owing</p>
                  <p className="text-xs text-gray-500">{format(keyDates.balanceOwingDate, 'MMMM d, yyyy')}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">{formatDaysLabel(daysUntil(keyDates.balanceOwingDate))}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#E9F3F7] rounded-xl">
                <CalendarClock className="w-4 h-4 text-[#487CA5] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Filing Deadline</p>
                  <p className="text-xs text-gray-500">{format(keyDates.filingDeadlineDate, 'MMMM d, yyyy')}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">{formatDaysLabel(daysUntil(keyDates.filingDeadlineDate))}</p>
              </div>
            </div>
            {keyDates.likelyRequiresInstallments && (
              <p className="text-xs text-gray-400 mt-4">
                Since your estimated total owing is over $3,000, the CRA's default expectation is quarterly
                installments ({keyDates.installmentDates.map((d) => format(d, 'MMM d')).join(' / ')}, about{' '}
                {formatMoney(summary.totalOwing / 4)} each) — but most people just pay the full amount by April 30
                instead and accept any small instalment interest. Totally optional.
              </p>
            )}
          </div>

          {profile?.gst_registered && (
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5 mt-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">GST/HST Remittance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 bg-[#F9F2F5] rounded-xl">
                  <ArrowLeftRight className="w-4 h-4 text-[#B35488] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Collected from clients</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">{formatMoney(gstSummary.collected)}</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#EEF3ED] rounded-xl">
                  <ArrowLeftRight className="w-4 h-4 text-[#548164] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Paid on purchases (ITCs)</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">{formatMoney(gstSummary.paid)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {gstSummary.netOwing >= 0
                  ? <>You'd owe the CRA <span className="font-semibold text-gray-900">{formatMoney(gstSummary.netOwing)}</span> for this year's GST/HST.</>
                  : <>The CRA would owe you <span className="font-semibold text-gray-900">{formatMoney(-gstSummary.netOwing)}</span> for this year's GST/HST.</>}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                An estimate from your recorded invoices and business expenses — not a filed GST/HST return.
              </p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
