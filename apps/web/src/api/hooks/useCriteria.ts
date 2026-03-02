import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { SelectionCriteria, ApiResponse } from '../../lib/types'
import { QUERY_KEYS, STALE_TIMES } from '../../lib/constants'

export function useCriteria(jobOfferId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_OFFERS.CRITERIA(jobOfferId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SelectionCriteria[]>>(
        `/job-offers/${jobOfferId}/criteria`
      )
      return response.data
    },
    enabled: !!jobOfferId,
    staleTime: STALE_TIMES.DETAIL,
  })
}

export function useGenerateCriteria() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (jobOfferId: string) => {
      const response = await apiClient.post(`/job-offers/${jobOfferId}/criteria/generate`)
      return response.data
    },
    onSuccess: (_, jobOfferId) => {
      // Invalidate criteria to trigger refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOB_OFFERS.CRITERIA(jobOfferId) })
      queryClient.invalidateQueries({ queryKey: ['job-offers', 'detail', jobOfferId] })
    },
  })
}
