import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { ApiResponse, ScoringDetailResponse, ProcessingStatus } from '../../lib/types'
import { QUERY_KEYS, STALE_TIMES } from '../../lib/constants'

export function useScoring(scoringId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SCORINGS.DETAIL(scoringId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ScoringDetailResponse>>(`/scorings/${scoringId}`)
      return response.data
    },
    enabled: !!scoringId,
    staleTime: STALE_TIMES.DETAIL,
    refetchInterval: (query) => {
      const data = query.state.data
      const status = data?.data?.scoring.status as ProcessingStatus | undefined
      if (status === 'processing' || status === 'pending') {
        return 3000 // Poll every 3 seconds while processing
      }
      return false
    },
  })
}

interface CalculateScoringParams {
  jobOfferId: string
  candidateId: string
}

export function useCalculateScoring() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ jobOfferId, candidateId }: CalculateScoringParams) => {
      const response = await apiClient.post(`/job-offers/${jobOfferId}/score/${candidateId}`)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', 'detail', variables.candidateId] })
      queryClient.invalidateQueries({ queryKey: ['job-offers', 'detail', variables.jobOfferId] })
      queryClient.invalidateQueries({ queryKey: ['scorings'] })
    },
  })
}
