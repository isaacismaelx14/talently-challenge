import { useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useJobOffer } from '@/api/hooks/useJobOffers'
import { useCriteria, useGenerateCriteria } from '@/api/hooks/useCriteria'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DetailPageSkeleton, EmptyState } from '@/components/shared'
import { EMPLOYMENT_TYPE_LABELS, CRITERIA_TYPE_LABELS, PRIORITY_LABELS, ROUTES } from '@/lib/constants'
import { formatDate, capitalizeWords } from '@/lib/utils'
import {
  Sparkles,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'

export default function JobOfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const jobOfferQuery = useJobOffer(id!)
  const criteriaQuery = useCriteria(id!)
  const generateMutation = useGenerateCriteria()

  const { data: jobData, isLoading: isLoadingJob } = jobOfferQuery
  const { data: criteriaData, isLoading: isLoadingCriteria } = criteriaQuery
  const { refetch: refetchJobOffer } = jobOfferQuery
  const { refetch: refetchCriteria } = criteriaQuery

  if (isLoadingJob) {
    return <DetailPageSkeleton />
  }

  const job = jobData?.data

  if (!job) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Job offer not found"
        description="The job offer you're looking for doesn't exist or has been removed."
        action={{ label: 'Back to Job Offers', onClick: () => window.history.back() }}
      />
    )
  }

  const handleGenerateCriteria = async () => {
    try {
      await generateMutation.mutateAsync(id!)
      toast.success('Criteria generation started. This may take a moment.')
    } catch {
      toast.error('Failed to generate criteria')
    }
  }

  const criteria = criteriaData?.data ?? []
  const hasCriteria = criteria.length > 0
  const isCriteriaRunning =
    job.criteria_generation_status === 'pending' ||
    job.criteria_generation_status === 'processing'
  const isCriteriaFailed = job.criteria_generation_status === 'failed'

  useEffect(() => {
    if (!isCriteriaRunning) {
      return
    }

    const interval = window.setInterval(() => {
      refetchJobOffer()
      refetchCriteria()
    }, 3000)

    return () => window.clearInterval(interval)
  }, [isCriteriaRunning, refetchCriteria, refetchJobOffer])

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.JOB_OFFERS}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Offers
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{job.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {EMPLOYMENT_TYPE_LABELS[job.employment_type] ||
                capitalizeWords(job.employment_type)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(job.created_at)}
            </span>
          </div>
        </div>
        <Badge
          variant={job.status === 'published' ? 'default' : 'secondary'}
          className="capitalize text-sm px-3 py-1"
        >
          {job.status}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="criteria">
            Selection Criteria
            {hasCriteria && (
              <Badge variant="secondary" className="ml-2">
                {criteria.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {job.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criteria" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">AI Selection Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Criteria used to evaluate candidates for this position
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={isCriteriaFailed ? 'destructive' : 'secondary'}>
                  {job.criteria_generation_status}
                </Badge>
                <span>Generated: {job.criteria_count}</span>
              </div>
            </div>
            {!hasCriteria && !isCriteriaRunning && (
              <Button
                onClick={handleGenerateCriteria}
                disabled={generateMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {generateMutation.isPending ? 'Generating...' : 'Generate with AI'}
              </Button>
            )}
          </div>

          {isLoadingCriteria ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="py-4">
                    <div className="h-5 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hasCriteria ? (
            <div className="grid gap-4 md:grid-cols-2">
              {criteria.map((crit) => (
                <Card key={crit.id} className="overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base">{crit.label}</CardTitle>
                      <Badge variant={getPriorityVariant(crit.priority)}>
                        {PRIORITY_LABELS[crit.priority] || crit.priority}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <span className="text-xs uppercase font-medium bg-muted px-2 py-0.5 rounded">
                        {CRITERIA_TYPE_LABELS[crit.type] || crit.type}
                      </span>
                      {crit.required && (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <CheckCircle2 className="h-3 w-3" />
                          Required
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Weight: {Number(crit.weight).toFixed(1)}</span>
                      {crit.expected_value && (
                        <div className="text-xs font-medium bg-muted px-2 py-1 rounded flex gap-2">
                          {'min' in crit.expected_value && crit.expected_value.min !== null && (
                            <span>Min: {crit.expected_value.min}</span>
                          )}
                          {'value' in crit.expected_value && crit.expected_value.value !== null && (
                            <span>Required: {crit.expected_value.value ? 'Yes' : 'No'}</span>
                          )}
                          {'level' in crit.expected_value && crit.expected_value.level !== null && (
                            <span>Level: {crit.expected_value.level}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-1">No criteria generated yet</h4>
                <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                  Generate AI-powered selection criteria based on the job description
                  to evaluate candidates effectively.
                </p>
                {isCriteriaRunning && (
                  <p className="text-xs text-muted-foreground mb-4">
                    AI is generating criteria. This section refreshes automatically.
                  </p>
                )}
                <Button
                  onClick={handleGenerateCriteria}
                  disabled={generateMutation.isPending || isCriteriaRunning}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isCriteriaRunning
                    ? 'Generating...'
                    : generateMutation.isPending
                      ? 'Generating...'
                      : 'Generate Criteria'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
