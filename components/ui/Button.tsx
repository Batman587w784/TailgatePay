import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'royal' | 'outline' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-600 shadow-btn',
  royal:   'bg-royal text-white hover:bg-royal-600 shadow-btn',
  outline: 'bg-white text-navy border border-surface-muted hover:bg-surface-subtle',
  ghost:   'bg-transparent text-navy hover:bg-navy-50',
  danger:  'bg-danger-bg text-danger-text border border-danger-border hover:bg-red-100',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-md rounded-lg gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'royal', size = 'md', loading, icon, iconRight, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-royal-300 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : icon}
        {children}
        {!loading && iconRight}
      </button>
    )
  }
)

Button.displayName = 'Button'