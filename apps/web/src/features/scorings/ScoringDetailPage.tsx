import { useParams, Link } from 'react-router'
import { useScoring } from '@/api/hooks/useScorings'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DetailPageSkeleton,
  EmptyState,
  StatusBadge,
  ScoreIndicator,
} from '@/components/shared'
import { ROUTES, SCORING_RESULT_LABELS, CRITERIA_TYPE_LABELS, PRIORITY_LABELS } from '@/lib/constants'
import type { CriteriaScore, ScoringGap, ProcessingStatus } from '@/lib/types'
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Target,
  User,
  Briefcase,
  Award,
  Info,
} from 'lucide-react'

export default function ScoringDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useScoring(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  const scoring = data?.data?.scoring
  const breakdown = data?.data?.breakdown

  if (!scoring) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Scoring not found"
        description="The scoring you're looking for doesn't exist or has been removed."
        action={{ label: 'Go Back', onClick: () => window.history.back() }}
      />
    )
  }

  const candidate = scoring.candidate
  const jobOffer = scoring.job_offer
  const gaps = (scoring.gaps as ScoringGap[] | null) ?? []
  const hasGaps = gaps.length > 0

  const getResultVariant = (result: string) => {
    switch (result) {
      case 'match':
        return 'default'
      case 'partial':
        return 'secondary'
      case 'no_match':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'match':
        return <CheckCircle2 className="h-3 w-3" />
      case 'partial':
        return <Info className="h-3 w-3" />
      case 'no_match':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={candidate ? ROUTES.CANDIDATE_DETAIL(candidate.public_id) : ROUTES.CANDIDATES}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidate
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Scoring Analysis</h2>
            <p className="text-muted-foreground mt-1">
              Detailed breakdown of candidate evaluation
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {candidate && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{candidate.name}</span>
              </div>
            )}
            {jobOffer && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{jobOffer.title}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status={scoring.status as ProcessingStatus} size="lg" />
          <ScoreIndicator score={Number(scoring.total_score)} size="lg" />
        </div>
      </div>

      {/* Gaps Alert */}
      {hasGaps && scoring.status === 'completed' && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Missing Required Criteria
            </CardTitle>
            <CardDescription className="text-destructive/80">
              The candidate does not meet the following required criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {gaps.map((gap, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm bg-background/50 p-3 rounded-md"
                >
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{gap.criteria_label}</p>
                    {gap.reason && (
                      <p className="text-muted-foreground text-xs mt-0.5">{gap.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {scoring.status === 'completed' && !hasGaps && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">
              Candidate meets all required criteria
            </span>
          </CardContent>
        </Card>
      )}

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Criteria Breakdown
          </CardTitle>
          <CardDescription>
            Individual scoring for each selection criterion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!breakdown || breakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {scoring.status === 'completed'
                  ? 'No criteria scores available.'
                  : 'Scoring is still in progress...'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {breakdown.map((score: CriteriaScore) => {
                const criteria = score.selection_criteria
                const percentage =
                  (Number(score.points_awarded) / Math.max(Number(score.max_points), 1)) * 100
                const confidence = Number(score.confidence * 100)

                return (
                  <div
                    key={score.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      {/* Criteria Info */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium leading-tight">
                            {criteria?.label ?? 'Unknown Criteria'}
                          </h4>
                          {criteria?.required && (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase font-medium bg-muted px-1.5 py-0.5 rounded">
                            {criteria?.type
                              ? CRITERIA_TYPE_LABELS[criteria.type] ?? criteria.type
                              : 'N/A'}
                          </span>
                          <span>•</span>
                          <span>
                            {criteria?.priority
                              ? PRIORITY_LABELS[criteria.priority] ?? criteria.priority
                              : 'N/A'}{' '}
                            Priority
                          </span>
                          <span>•</span>
                          <span>Weight: {Number(criteria?.weight ?? 0).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Result Badge */}
                      <div className="md:col-span-2 flex md:justify-center">
                        <Badge
                          variant={getResultVariant(score.result)}
                          className="gap-1"
                        >
                          {getResultIcon(score.result)}
                          {SCORING_RESULT_LABELS[score.result] ?? score.result}
                        </Badge>
                      </div>

                      {/* Progress & Points */}
                      <div className="md:col-span-6 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Confidence: {confidence.toFixed(0)}%
                          </span>
                          <span className="font-semibold">
                            {Number(score.points_awarded).toFixed(1)} /{' '}
                            {Number(score.max_points).toFixed(1)} pts
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        {score.evidence && (
                          <div className="text-xs bg-muted p-2 rounded mt-2">
                            <span className="font-medium text-muted-foreground">
                              Evidence:{' '}
                            </span>
                            <span className="italic">{score.evidence}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
