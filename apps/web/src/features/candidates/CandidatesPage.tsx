import { useState, useCallback, useRef } from 'react'
import { useCandidates, useUploadCandidate } from '@/api/hooks/useCandidates'
import { useJobOffers } from '@/api/hooks/useJobOffers'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Link } from 'react-router'
import { ROUTES, MAX_FILE_SIZE_MB } from '@/lib/constants'
import { toast } from 'sonner'
import { StatusBadge, EmptyState, LoadingState } from '@/components/shared'
import { formatFileSize, getInitials } from '@/lib/utils'
import { z } from 'zod'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Upload,
  FileText,
  Eye,
  Users,
  Mail,
  AlertCircle,
} from 'lucide-react'
import type { ProcessingStatus } from '@/lib/types'

const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

const uploadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  job_offer_id: z.string().min(1, 'Please select a job offer'),
  cv: z
    .instanceof(File, { message: 'Please select a PDF file' })
    .refine((file) => file.type === 'application/pdf', 'Only PDF files are allowed')
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `File size must be less than ${MAX_FILE_SIZE_MB}MB`
    ),
})

type UploadFormData = z.infer<typeof uploadSchema>

export default function CandidatesPage() {
  const [page] = useState(1)
  const { data, isLoading } = useCandidates(page)
  const { data: jobsData, isLoading: isLoadingJobs } = useJobOffers(1)
  const uploadMutation = useUploadCandidate()
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  })

  const selectedFile = useWatch({ control, name: 'cv' })

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setValue('cv', file, { shouldValidate: true })
      }
    },
    [setValue]
  )

  const onSubmit = async (formData: UploadFormData) => {
    const data = new FormData()
    data.append('name', formData.name)
    data.append('email', formData.email)
    data.append('job_offer_id', formData.job_offer_id)
    data.append('cv', formData.cv)

    try {
      await uploadMutation.mutateAsync(data)
      toast.success('CV uploaded successfully. Extraction in progress.')
      reset()
      setIsOpen(false)
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { errors?: { cv?: string[] } } } };
        toast.error(err?.response?.data?.errors?.cv?.[0] || 'Failed to upload CV');
      } else {
        toast.error('Failed to upload CV')
      }
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      reset()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const candidates = data?.data ?? []
  const jobs = jobsData?.data ?? []

  if (isLoading) {
    return <LoadingState message="Loading candidates..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Candidates</h2>
          <p className="text-muted-foreground">
            Upload and manage candidate CVs for evaluation
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload CV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Candidate CV</DialogTitle>
              <DialogDescription>
                Upload a PDF CV to extract candidate information automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv">CV Document (PDF)</Label>
                <input
                  ref={fileInputRef}
                  id="cv"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <label
                  htmlFor="cv"
                  className={`block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 ${errors.cv ? 'border-destructive' : 'border-muted-foreground/25'}`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to select a PDF file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max size: {MAX_FILE_SIZE_MB}MB
                      </p>
                    </>
                  )}
                </label>
                {errors.cv && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cv.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_offer_id">Target Job Offer</Label>
                <Controller
                  name="job_offer_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger aria-invalid={!!errors.job_offer_id}>
                        <SelectValue placeholder="Select a job offer" />
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
                  )}
                />
                {errors.job_offer_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.job_offer_id.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  'Uploading...'
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CV
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates yet"
          description="Upload your first candidate CV to start evaluating applicants."
          action={{
            label: 'Upload CV',
            onClick: () => setIsOpen(true),
          }}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Extraction Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.public_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {getInitials(candidate.name)}
                      </div>
                      <span className="font-medium">{candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {candidate.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={candidate.extraction_status as ProcessingStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={ROUTES.CANDIDATE_DETAIL(candidate.public_id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
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
