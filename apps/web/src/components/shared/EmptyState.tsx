import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FileQuestion, Inbox, Search, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Pre-configured empty states for common scenarios
export function NoDataFound({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No data found"
      description="There's nothing here yet. Create your first item to get started."
      action={onAction ? { label: 'Create New', onClick: onAction } : undefined}
    />
  )
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search.`}
    />
  )
}
