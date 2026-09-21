import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border', {
  variants: {
    variant: {
      neutral: 'bg-slate-100 text-slate-700 border-slate-200',
      brand: 'bg-brand-50 text-brand-700 border-brand-200',
      success: 'bg-success-100 text-green-800 border-green-200',
      warning: 'bg-warning-100 text-amber-800 border-amber-200',
      critical: 'bg-critical-100 text-red-800 border-red-200',
      offline: 'bg-offline-100 text-slate-600 border-slate-200',
      outline: 'bg-white text-navy-700 border-slate-300',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
