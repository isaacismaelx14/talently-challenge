import { cn, getScoreColorClass } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface ScoreIndicatorProps {
  score: number
  maxScore?: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
}

const progressHeights = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function ScoreIndicator({
  score,
  maxScore = 100,
  size = 'md',
  showProgress = true,
  className,
}: ScoreIndicatorProps) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const colorClass = getScoreColorClass(percentage)

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-bold', sizeClasses[size], colorClass)}>
          {Math.round(score)}
        </span>
        <span className="text-muted-foreground text-sm">/ {maxScore}</span>
      </div>
      {showProgress && (
        <Progress value={percentage} className={cn('w-full', progressHeights[size])} />
      )}
    </div>
  )
}

interface ScoreCircleProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const circleSizes = {
  sm: 'w-12 h-12 text-sm',
  md: 'w-16 h-16 text-lg',
  lg: 'w-24 h-24 text-2xl',
}

export function ScoreCircle({ score, size = 'md', className }: ScoreCircleProps) {
  const colorClass = getScoreColorClass(score)
  
  const getBgClass = (score: number): string => {
    if (score >= 80) return 'bg-green-100 border-green-300'
    if (score >= 60) return 'bg-yellow-100 border-yellow-300'
    return 'bg-red-100 border-red-300'
  }

  return (
    <div
      className={cn(
        'rounded-full border-2 flex items-center justify-center font-bold',
        circleSizes[size],
        getBgClass(score),
        colorClass,
        className
      )}
    >
      {Math.round(score)}
    </div>
  )
}
