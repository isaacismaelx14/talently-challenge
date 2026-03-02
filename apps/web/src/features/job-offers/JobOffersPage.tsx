import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useJobOffers, useCreateJobOffer } from '@/api/hooks/useJobOffers'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router'
import { ROUTES, EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { formatDate, capitalizeWords } from '@/lib/utils'
import { toast } from 'sonner'
import { TableSkeleton, EmptyState } from '@/components/shared'
import type { EmploymentType } from '@/lib/types'
import { Plus, ExternalLink, Briefcase } from 'lucide-react'

const createJobOfferSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract']),
})

type CreateJobOfferForm = z.infer<typeof createJobOfferSchema>

export default function JobOffersPage() {
  const [page] = useState(1)
  const { data, isLoading } = useJobOffers(page)
  const createMutation = useCreateJobOffer()
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateJobOfferForm>({
    resolver: zodResolver(createJobOfferSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      employment_type: 'full_time',
    },
  })

  const employmentType = useWatch({
    control: form.control,
    name: 'employment_type',
  })

  const onSubmit = async (formData: CreateJobOfferForm) => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success('Job offer created successfully')
      setIsOpen(false)
      form.reset()
    } catch {
      toast.error('Failed to create job offer')
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Job Offers</h2>
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    )
  }

  const jobOffers = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Job Offers</h2>
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Job Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Job Offer</DialogTitle>
              <DialogDescription>
                Add a new job position. You can generate AI selection criteria after creation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Software Engineer"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter detailed job description..."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Remote, New York, London"
                  {...form.register('location')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={employmentType}
                  onValueChange={(value: EmploymentType) =>
                    form.setValue('employment_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Job Offer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {jobOffers.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job offers yet"
          description="Create your first job offer to start receiving and scoring candidates."
          action={{ label: 'Create Job Offer', onClick: () => setIsOpen(true) }}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Employment Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobOffers.map((job) => (
                <TableRow key={job.public_id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type] ||
                      capitalizeWords(job.employment_type)}
                  </TableCell>
                  <TableCell>{job.location || 'Remote'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={job.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(job.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={ROUTES.JOB_OFFER_DETAIL(job.public_id)}>
                        View Details
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
