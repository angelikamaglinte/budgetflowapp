import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

export function FinalCtaSection() {
  const navigate = useNavigate()

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.4 }}
        className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-balance"
      >
        Stop guessing what you owe. Start tracking for free.
      </motion.h2>
      <PrimaryButton onClick={() => navigate('/signup')} className="px-7 py-3 rounded-xl text-sm font-semibold mx-auto">
        Start Free
      </PrimaryButton>
    </section>
  )
}
