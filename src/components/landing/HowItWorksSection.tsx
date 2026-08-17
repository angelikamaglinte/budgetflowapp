import { motion } from 'motion/react'

const STEPS = [
  {
    number: '01',
    title: 'Sign up and set your rate',
    description: 'Tell us your tax and savings percentage — takes less than a minute.',
  },
  {
    number: '02',
    title: 'Track as you work',
    description: 'Log expenses and send invoices right as they happen.',
  },
  {
    number: '03',
    title: 'Watch it build itself',
    description: 'Your tax reserve, reports, and reminders update automatically.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="text-center sm:text-left"
          >
            <span className="text-sm font-mono font-semibold text-primary-600">{step.number}</span>
            <h3 className="font-semibold text-gray-900 mt-2 mb-1.5">{step.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
