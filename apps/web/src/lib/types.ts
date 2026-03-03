// Enums matching backend
export type EmploymentType = 'full_time' | 'part_time' | 'contract'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type CriteriaType = 'boolean' | 'years' | 'enum' | 'score_1_5'
export type Priority = 'high' | 'medium' | 'low'
export type ScoringResult = 'match' | 'partial' | 'no_match' | 'unknown'

// User entity
export interface User {
  id: number
  public_id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

// Job Offer entity
export interface JobOffer {
  public_id: string
  title: string
  description: string
  location: string | null
  employment_type: EmploymentType
  status: string
  criteria_generation_status: ProcessingStatus
  criteria_count: number
  criteria_generated_at: string | null
  posted_at: string | null
  selection_criteria?: SelectionCriteria[]
  candidate_scorings?: CandidateScoring[]
  created_at: string
  updated_at: string
}

// Expected value types for criteria
export interface BooleanExpectedValue {
  value: boolean
}

export interface YearsExpectedValue {
  min: number
}

export interface EnumExpectedValue {
  level: string
  levels?: string[]
}

export interface ScoreExpectedValue {
  min: number
}

export type ExpectedValue = 
  | BooleanExpectedValue 
  | YearsExpectedValue 
  | EnumExpectedValue 
  | ScoreExpectedValue

// Selection Criteria entity
export interface SelectionCriteria {
  id: number
  job_offer_id: string
  key: string
  label: string
  type: CriteriaType
  required: boolean
  priority: Priority
  expected_value: ExpectedValue | null
  weight: number
  created_at: string
  updated_at: string
}

// Extracted CV data structure
export interface ExtractedCVData {
  personal_info?: {
    name?: string
    email?: string
    phone?: string
    location?: string
  }
  total_years_experience?: number
  skills?: string[]
  technology_experience?: {
    technology: string
    years: number
  }[]
  experience?: {
    title: string
    company: string
    start_date?: string
    end_date?: string
    duration?: string
    years?: number
    description?: string
    technologies?: string[]
  }[]
  education?: {
    degree: string
    institution: string
    year?: string
  }[]
  languages?: {
    language: string
    level: string
  }[]
  certifications?: string[]
  raw_text?: string
}

// Candidate entity
export interface Candidate {
  public_id: string
  name: string
  email: string
  cv_hash: string
  cv_file_path: string
  extracted_data: ExtractedCVData | null
  extraction_status: ProcessingStatus
  scorings?: CandidateScoring[]
  created_at: string
  updated_at: string
}

// Gap identified in scoring
export interface ScoringGap {
  criteria_key: string
  criteria_label: string
  reason: string
}

// Candidate Scoring entity
export interface CandidateScoring {
  public_id: string
  candidate_id: string
  job_offer_id: string
  total_score: number
  status: ProcessingStatus
  gaps: ScoringGap[]
  calculated_at: string | null
  candidate?: Candidate
  job_offer?: JobOffer
  criteria_scores?: CriteriaScore[]
  created_at: string
  updated_at: string
}

// Individual criterion score
export interface CriteriaScore {
  id: number
  candidate_scoring_id: string
  selection_criteria_id: string
  result: ScoringResult
  points_awarded: number
  max_points: number
  evidence: string | null
  confidence: number
  selection_criteria?: SelectionCriteria
  created_at: string
  updated_at: string
}

// API response wrappers
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  per_page: number
  current_page: number
  last_page: number
  from?: number | null
  to?: number | null
  meta?: {
    pagination?: {
      total: number
      count: number
    }
  }
}

// API error response
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// Login request/response
export interface LoginRequest {
  email: string
  password: string
  device_name?: string
}

export interface LoginResponse {
  token: string
  user: User
}

// Create job offer request
export interface CreateJobOfferRequest {
  title: string
  description: string
  location?: string
  employment_type: EmploymentType
  status?: string
  posted_at?: string
}

// Dashboard statistics
export interface DashboardStats {
  total_job_offers: number
  total_candidates: number
  completed_scorings: number
  average_score: number | null
  recent_scorings: CandidateScoring[]
}

// Scoring detail response
export interface ScoringDetailResponse {
  scoring: CandidateScoring
  breakdown: CriteriaScore[]
}
