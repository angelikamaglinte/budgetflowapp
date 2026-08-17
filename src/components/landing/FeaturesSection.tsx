import { motion } from 'motion/react'
import { CreditCard, FileText, ShieldCheck, RefreshCw, BarChart3, FolderOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  iconBg: string
  iconColor: string
}

const FEATURES: Feature[] = [
  {
    icon: CreditCard,
    title: 'Expense tracking',
    description: 'Log business and personal expenses, categorized automatically.',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    icon: FileText,
    title: 'Invoices that get you paid',
    description: "Build professional itemized PDF invoices in minutes, and track who's paid, pending, or overdue.",
    iconBg: 'bg-[#E9F3F7]',
    iconColor: 'text-[#487CA5]',
  },
  {
    icon: ShieldCheck,
    title: 'Never guess your taxes again',
    description: 'Set your tax reserve percentage once; every payment shows exactly what to set aside.',
    iconBg: 'bg-[#FAF3DD]',
    iconColor: 'text-[#C29343]',
  },
  {
    icon: RefreshCw,
    title: "Automations that work while you don't",
    description: 'Recurring expenses and invoices log themselves on schedule, with email and in-app notifications.',
    iconBg: 'bg-[#EEF3ED]',
    iconColor: 'text-[#548164]',
  },
  {
    icon: BarChart3,
    title: 'Reports built for tax time',
    description: 'Quarterly tax estimates, profit & loss, year-over-year comparisons — generated automatically from your real data.',
    iconBg: 'bg-[#F6F3F8]',
    iconColor: 'text-[#8A67AB]',
  },
  {
    icon: FolderOpen,
    title: 'Everything in one place',
    description: 'Contacts, files, receipts, and notes, without juggling five different apps.',
    iconBg: 'bg-[#F9F2F5]',
    iconColor: 'text-[#B35488]',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
              <f.icon className={`w-5 h-5 ${f.iconColor}`} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
