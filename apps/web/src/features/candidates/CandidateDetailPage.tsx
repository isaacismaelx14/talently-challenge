import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useCandidate } from '@/api/hooks/useCandidates'
import { useCalculateScoring } from '@/api/hooks/useScorings'
import { useJobOffers } from '@/api/hooks/useJobOffers'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  DetailPageSkeleton,
  EmptyState,
  StatusBadge,
  ScoreIndicator,
} from '@/components/shared'
import { ROUTES } from '@/lib/constants'
import { formatDate, getInitials, truncate } from '@/lib/utils'
import type { ExtractedCVData, ProcessingStatus } from '@/lib/types'
import {
  ArrowLeft,
  Mail,
  FileText,
  Calculator,
  Award,
  Briefcase,
  GraduationCap,
  Languages,
  Code,
  User,
  AlertCircle,
  Eye,
  Clock,
} from 'lucide-react'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: candidateData, isLoading } = useCandidate(id!)
  const { data: jobsData, isLoading: isLoadingJobs } = useJobOffers(1)
  const calculateMutation = useCalculateScoring()
  const [selectedJobId, setSelectedJobId] = useState<string>('')

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  const candidate = candidateData?.data

  if (!candidate) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Candidate not found"
        description="The candidate you're looking for doesn't exist or has been removed."
        action={{ label: 'Back to Candidates', onClick: () => window.history.back() }}
      />
    )
  }

  const handleCalculateScore = async () => {
    if (!selectedJobId) {
      toast.error('Please select a job offer first')
      return
    }
    try {
      await calculateMutation.mutateAsync({
        jobOfferId: selectedJobId,
        candidateId: id!,
      })
      toast.success('Scoring calculation started. This may take a moment.')
    } catch {
      toast.error('Failed to start calculation')
    }
  }

  const extractedData = candidate.extracted_data as ExtractedCVData | null
  const scorings = candidate.scorings ?? []
  const jobs = jobsData?.data ?? []
  const isExtractionComplete = candidate.extraction_status === 'completed'

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.CANDIDATES}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
            {getInitials(candidate.name)}
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{candidate.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Mail className="h-4 w-4" />
              {candidate.email}
            </div>
          </div>
        </div>
        <StatusBadge status={candidate.extraction_status as ProcessingStatus} />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Email Address</span>
              <span className="font-medium">{candidate.email}</span>
            </div>
            {extractedData?.total_years_experience && (
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Total Experience</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  {extractedData.total_years_experience} year{extractedData.total_years_experience !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Resume Hash</span>
              <span className="font-mono text-sm" title={candidate.cv_hash}>
                {truncate(candidate.cv_hash, 32)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="font-medium">{formatDate(candidate.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Calculate Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Score
            </CardTitle>
            <CardDescription>
              Select a job offer to evaluate this candidate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isExtractionComplete && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                CV extraction must complete before scoring
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job offer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingJobs ? (
                      <SelectItem value="disabled-loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : jobs.length === 0 ? (
                      <SelectItem value="disabled-empty" disabled>
                        No job offers available
                      </SelectItem>
                    ) : (
                      jobs.map((job) => (
                        <SelectItem key={job.public_id} value={job.public_id}>
                          {job.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCalculateScore}
                disabled={calculateMutation.isPending || !isExtractionComplete}
              >
                {calculateMutation.isPending ? 'Starting...' : 'Calculate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Scoring Results
          </CardTitle>
          <CardDescription>
            Previous scoring calculations for this candidate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scorings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No scorings calculated yet. Select a job offer above to start.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scorings.map((scoring) => (
                <div
                  key={scoring.public_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <ScoreIndicator score={scoring.total_score} size="lg" />
                    <div>
                      <span className="font-medium">
                        {scoring.job_offer?.title ?? 'Unknown Job Offer'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          status={scoring.status as ProcessingStatus}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={ROUTES.SCORING_DETAIL(scoring.public_id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Breakdown
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Extracted CV Data
          </CardTitle>
          <CardDescription>
            Information automatically extracted from the candidate's CV
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extractedData ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Experience */}
              {extractedData.experience && extractedData.experience.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Work Experience
                    {extractedData.total_years_experience && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {extractedData.total_years_experience}+ yrs total
                      </Badge>
                    )}
                  </h4>
                  <div className="space-y-3">
                    {extractedData.experience.slice(0, 5).map((exp, i) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-3">
                        <p className="font-medium text-sm">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {exp.start_date && exp.end_date && (
                            <span>{exp.start_date} – {exp.end_date}</span>
                          )}
                          {exp.years != null && (
                            <span className="text-primary font-medium">
                              ({exp.years} yr{exp.years !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exp.technologies.slice(0, 6).map((tech, j) => (
                              <Badge key={j} variant="outline" className="text-[10px] px-1.5 py-0">
                                {tech}
                              </Badge>
                            ))}
                            {exp.technologies.length > 6 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{exp.technologies.length - 6}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {extractedData.experience.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{extractedData.experience.length - 5} more positions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Education */}
              {extractedData.education && extractedData.education.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </h4>
                  <div className="space-y-3">
                    {extractedData.education.map((edu, i) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-3">
                        <p className="font-medium text-sm">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {edu.year && (
                          <p className="text-xs text-muted-foreground">{edu.year}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technology Experience (with years) */}
              {extractedData.technology_experience && extractedData.technology_experience.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Technology Experience
                  </h4>
                  <div className="space-y-1.5">
                    {extractedData.technology_experience
                      .sort((a, b) => b.years - a.years)
                      .slice(0, 12)
                      .map((tech, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{tech.technology}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary rounded-full h-1.5 transition-all"
                                style={{ width: `${Math.min((tech.years / (extractedData.total_years_experience || 10)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {tech.years} yr{tech.years !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    {extractedData.technology_experience.length > 12 && (
                      <p className="text-xs text-muted-foreground">
                        +{extractedData.technology_experience.length - 12} more technologies
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {extractedData.skills && extractedData.skills.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.skills.slice(0, 12).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {extractedData.skills.length > 12 && (
                      <Badge variant="outline" className="text-xs">
                        +{extractedData.skills.length - 12} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Languages */}
              {extractedData.languages && extractedData.languages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Languages
                  </h4>
                  <div className="space-y-2">
                    {extractedData.languages.map((lang, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{lang.language}</span>
                        {lang.level && (
                          <Badge variant="outline" className="text-xs">
                            {lang.level}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isExtractionComplete
                  ? 'No data could be extracted from this CV.'
                  : 'CV extraction is still in progress...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
