// Application route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  JOB_OFFERS: '/job-offers',
  JOB_OFFER_DETAIL: (id: string) => `/job-offers/${id}`,
  CANDIDATES: '/candidates',
  CANDIDATE_DETAIL: (id: string) => `/candidates/${id}`,
  SCORING_DETAIL: (id: string) => `/scorings/${id}`,
} as const

// API base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1'

// File upload limits
export const MAX_FILE_SIZE_MB = 10
export const ALLOWED_FILE_TYPES = ['application/pdf'] as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
} as const

// Query keys for TanStack Query
export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
  },
  JOB_OFFERS: {
    LIST: (page: number) => ['job-offers', 'list', page] as const,
    DETAIL: (id: string) => ['job-offers', 'detail', id] as const,
    CRITERIA: (id: string) => ['job-offers', id, 'criteria'] as const,
  },
  CANDIDATES: {
    LIST: (page: number) => ['candidates', 'list', page] as const,
    DETAIL: (id: string) => ['candidates', 'detail', id] as const,
  },
  SCORINGS: {
    DETAIL: (id: string) => ['scorings', 'detail', id] as const,
  },
} as const

// API stale times (in milliseconds)
export const STALE_TIMES = {
  LIST: 5 * 60 * 1000, // 5 minutes
  DETAIL: 1 * 60 * 1000, // 1 minute
  STATS: 2 * 60 * 1000, // 2 minutes
} as const

// Employment type labels
export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
}

// Processing status labels
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

// Priority labels
export const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// Criteria type labels
export const CRITERIA_TYPE_LABELS: Record<string, string> = {
  boolean: 'Yes/No',
  years: 'Years',
  enum: 'Level',
  score_1_5: 'Score (1-5)',
}

// Scoring result labels
export const SCORING_RESULT_LABELS: Record<string, string> = {
  match: 'Match',
  partial: 'Partial',
  no_match: 'No Match',
  unknown: 'Unknown',
}
