import { useJobOffers } from '@/api/hooks/useJobOffers'
import { useCandidates } from '@/api/hooks/useCandidates'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import { ROUTES } from '@/lib/constants'
import { DashboardSkeleton } from '@/components/shared'
import {
  Briefcase,
  Users,
  FileCheck,
  TrendingUp,
  Plus,
  Upload,
  ArrowRight,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: jobOffersData, isLoading: isLoadingJobs } = useJobOffers(1)
  const { data: candidatesData, isLoading: isLoadingCandidates } = useCandidates(1)

  const isLoading = isLoadingJobs || isLoadingCandidates

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const totalJobs = jobOffersData?.total ?? 0
  const totalCandidates = candidatesData?.total ?? 0

  // Calculate completed scorings from candidates data
  const completedScorings = candidatesData?.data.reduce((acc, candidate) => {
    return acc + (candidate.scorings?.filter(s => s.status === 'completed').length ?? 0)
  }, 0) ?? 0

  // Calculate average score from completed scorings
  const allScores = candidatesData?.data.flatMap(
    candidate => candidate.scorings?.filter(s => s.status === 'completed').map(s => s.total_score) ?? []
  ) ?? []
  const averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null

  const stats = [
    {
      title: 'Total Job Offers',
      value: totalJobs,
      icon: Briefcase,
      description: 'Active positions',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Total Candidates',
      value: totalCandidates,
      icon: Users,
      description: 'CVs uploaded',
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Completed Scorings',
      value: completedScorings,
      icon: FileCheck,
      description: 'Evaluations done',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Average Score',
      value: averageScore !== null ? `${averageScore}%` : 'N/A',
      icon: TrendingUp,
      description: 'Across all matches',
      color: 'text-orange-600 bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your recruitment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to={ROUTES.JOB_OFFERS}>
              <Plus className="mr-2 h-4 w-4" />
              New Job Offer
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.CANDIDATES}>
              <Upload className="mr-2 h-4 w-4" />
              Upload CV
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Offers
            </CardTitle>
            <CardDescription>
              Manage your job postings and generate AI selection criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between">
              <Link to={ROUTES.JOB_OFFERS}>
                View all job offers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidates
            </CardTitle>
            <CardDescription>
              Upload CVs and calculate match scores against job offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="w-full justify-between">
              <Link to={ROUTES.CANDIDATES}>
                View all candidates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
