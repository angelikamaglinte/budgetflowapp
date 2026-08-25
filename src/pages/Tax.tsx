import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, Landmark, MapPin, ShieldCheck, Receipt, Wallet, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { useInvoices } from '@/hooks/useInvoices'
import { useExpenses } from '@/hooks/useExpenses'
import { useBusinessProfile, useSaveBusinessProfile } from '@/hooks/useBusinessProfile'
import { useAuth } from '@/contexts/AuthContext'
import { computeAnnualNetIncome, computeTaxSummary, PROVINCE_LABELS } from '@/lib/canadianTax'
import type { ProvinceCode } from '@/lib/canadianTax'
import { formatMoney } from '@/lib/savingsCalculator'

function formatPercent(n: number) {
  return n.toFixed(1) + '%'
}

export default function Tax() {
  const { user } = useAuth()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const { data: invoices = [], isLoading: loadingInv } = useInvoices()
  const { data: expenses = [], isLoading: loadingExp } = useExpenses()
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile()
  const saveProfile = useSaveBusinessProfile()

  const province = (profile?.province as ProvinceCode | null) ?? null

  const income = useMemo(() => computeAnnualNetIncome(invoices, expenses, year), [invoices, expenses, year])
  const summary = useMemo(() => computeTaxSummary(income.netIncome, province), [income.netIncome, province])

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
        </>
      )}
    </AppLayout>
  )
}
