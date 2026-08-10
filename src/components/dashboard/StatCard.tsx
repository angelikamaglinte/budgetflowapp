import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  format?: (n: number) => string
  icon: ReactNode
  iconBg: string
  trend?: string
  trendUp?: boolean
  delay?: number
  glow?: boolean
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function StatCard({ label, value, format = formatMoney, icon, iconBg, trend, trendUp, delay = 0, glow = false }: StatCardProps) {
  const motionValue = useMotionValue(0)
  const formatted = useTransform(motionValue, (v) => format(v))

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: 'easeOut', delay })
    return controls.stop
  }, [value, motionValue, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        'bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow',
        glow && 'glow-pulse'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}
        >
          {icon}
        </motion.div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              trendUp
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <motion.p className="text-2xl font-bold text-gray-900 mb-1">{formatted}</motion.p>
      <p className="text-sm text-gray-500">{label}</p>
    </motion.div>
  )
}
