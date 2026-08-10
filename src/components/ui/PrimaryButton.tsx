import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

interface PrimaryButtonProps extends NativeButtonProps {
  children: ReactNode
}

/**
 * Primary CTA button — subtle lift + shadow on hover, tactile press on tap.
 * Restrained on purpose (replaces an earlier shine-sweep effect that felt
 * too flashy for a finance app).
 */
export function PrimaryButton({ children, className, ...props }: PrimaryButtonProps) {
  return (
    <motion.button
      {...props}
      whileHover={{ scale: 1.03, y: -1, boxShadow: '0 8px 20px rgba(20, 33, 39, 0.25)' }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white transition-colors',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
