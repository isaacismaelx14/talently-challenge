import { cn } from '@/lib/utils'
import type { ProcessingStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: ProcessingStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<
  ProcessingStatus,
  { icon: typeof Clock; bgClass: string; textClass: string }
> = {
  pending: {
    icon: Clock,
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800',
  },
  processing: {
    icon: Loader2,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
  },
  completed: {
    icon: CheckCircle2,
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
  },
  failed: {
    icon: XCircle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const label = STATUS_LABELS[status] || status

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            status === 'processing' && 'animate-spin'
          )}
        />
      )}
      {label}
    </span>
  )
}
