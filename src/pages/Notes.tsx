import { AppLayout } from '@/components/layout/AppLayout'

const sections = [
  {
    title: 'Payment Schedule',
    color: 'blue',
    items: [
      { label: 'Satori BLP', value: 'Invoiced end of month → Paid quickly (same month / early next month)' },
      { label: '360 Integrations', value: 'Invoiced end of month → Paid after 30 days (next month)' },
    ],
  },
]

export default function Notes() {
  return (
    <AppLayout title="Notes" subtitle="Your contractor budgeting system reference">
      <div className="max-w-2xl flex flex-col gap-6">

        {/* Budgeting Rule */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">Budgeting Rule</h2>
          <p className="text-sm text-blue-900 font-medium mb-2">
            Income received <span className="underline">this month</span> = Pay <span className="underline">this month's</span> expenses
          </p>
          <div className="flex flex-col gap-1 mt-3">
            <p className="text-sm text-blue-700">• January work → Paid in February → Covers February expenses</p>
            <p className="text-sm text-blue-700">• February work → Paid in March → Covers March expenses</p>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Payment Schedule</h2>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-gray-900">Satori BLP</p>
              <p className="text-sm text-gray-500">Invoiced end of month → Paid quickly (same month / early next month)</p>
            </div>
            <div className="h-px bg-gray-50" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-gray-900">360 Integrations</p>
              <p className="text-sm text-gray-500">Invoiced end of month → Paid after 30 days (next month)</p>
            </div>
          </div>
        </div>

        {/* Allocation Formula */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Allocation Formula (per payment)</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Tax (20%)', desc: 'Keep in Simplii Savings — do NOT touch', color: 'bg-red-50 text-red-700 border-red-100' },
              { label: 'Personal Savings (10%)', desc: 'Transfer to TD Savings', color: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'Business Expenses', desc: 'Reimburse to TD Chequing (if paid from TD)', color: 'bg-amber-50 text-amber-700 border-amber-100' },
              { label: 'Personal Expenses', desc: 'Transfer to TD Chequing', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            ].map(({ label, desc, color }) => (
              <div key={label} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${color}`}>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs opacity-75 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Process */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Transfer Process</h2>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium text-xs">Simplii Savings</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium text-xs">Simplii Chequing</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium text-xs">TD Accounts</div>
            </div>
          </div>
        </div>

        {/* Monthly Fixed Expenses */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Monthly Fixed Expenses</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Tuition fee (Uncle)', amount: '$2,000' },
              { label: 'Rent & Utilities', amount: '$1,000' },
              { label: 'Family Support (Mom)', amount: '$1,000' },
              { label: 'Business Expenses', amount: '~$217' },
              { label: 'Personal & variable expenses', amount: 'varies' },
            ].map(({ label, amount }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Accounts</h2>
          <div className="flex flex-col gap-2">
            {[
              { account: 'Simplii Savings', purpose: 'Tax money only (20% of all income)', tag: 'tax' },
              { account: 'Simplii Chequing', purpose: 'Receive income, pay business expenses', tag: 'income' },
              { account: 'TD Savings', purpose: 'Personal savings (10% of all income)', tag: 'savings' },
              { account: 'TD Chequing', purpose: 'Personal living expenses', tag: 'personal' },
            ].map(({ account, purpose }) => (
              <div key={account} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm font-semibold text-gray-900">{account}</p>
                <p className="text-xs text-gray-500">{purpose}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-3">Important Reminders</h2>
          <div className="flex flex-col gap-1.5">
            {[
              'Set aside tax & savings IMMEDIATELY when payment arrives',
              'Pay business expenses from Simplii going forward',
              'Separate each payment\'s budget — don\'t mix',
              'Track everything in the app',
            ].map((reminder) => (
              <p key={reminder} className="text-sm text-amber-800">✓ {reminder}</p>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
