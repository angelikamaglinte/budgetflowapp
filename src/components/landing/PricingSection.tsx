import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'

const FREE_FEATURES = ['Expense tracking', 'Invoice tracker', 'Dashboard overview & tax reserve calculator', 'Contacts & Files']

const PRO_FEATURES = [
  'Everything in Free',
  'Professional PDF Invoice Builder',
  'Recurring expenses & invoices',
  'Full Reports suite',
  'Invoice reminders with email notifications',
  'Purchase Savings Calculator',
]

export function PricingSection() {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-16 scroll-mt-20">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12 text-balance">
        Start free. Upgrade when you're ready to automate.
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.07)] flex flex-col"
        >
          <h3 className="font-semibold text-gray-900 text-lg mb-1">Free</h3>
          <p className="text-3xl font-bold text-gray-900 mb-5">$0</p>
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check className="w-4 h-4 text-[#548164] mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Start Free
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-primary-600 rounded-2xl p-7 shadow-[0_4px_16px_rgba(20,33,39,0.25)] flex flex-col text-white relative"
        >
          <span className="absolute -top-3 right-6 bg-white text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">
            Coming soon
          </span>
          <h3 className="font-semibold text-lg mb-1">Pro</h3>
          <p className="text-3xl font-bold mb-5">
            $15<span className="text-base font-medium text-primary-200">/month</span>
          </p>
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-primary-100">
                <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            title="Coming soon"
            className="w-full py-2.5 bg-white/90 text-primary-700 rounded-xl text-sm font-semibold cursor-not-allowed opacity-80"
          >
            Go Pro
          </button>
        </motion.div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-6">No credit card required to start.</p>
    </section>
  )
}
