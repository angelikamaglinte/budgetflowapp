import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

export function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5 text-balance"
      >
        Run your freelance business like a business.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-lg text-gray-500 max-w-2xl mx-auto mb-8"
      >
        Track expenses, send professional invoices, and always know what to set aside for taxes —
        built specifically for independent contractors.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center justify-center gap-3"
      >
        <PrimaryButton onClick={() => navigate('/signup')} className="px-6 py-3 rounded-xl text-sm font-semibold">
          Start Free
        </PrimaryButton>
        <a
          href="#features"
          className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition"
        >
          See features
        </a>
      </motion.div>
    </section>
  )
}
