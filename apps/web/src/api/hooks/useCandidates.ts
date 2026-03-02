import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { Candidate, PaginatedResponse, ApiResponse, ProcessingStatus } from '../../lib/types'
import { QUERY_KEYS, STALE_TIMES } from '../../lib/constants'

export function useCandidates(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.CANDIDATES.LIST(page),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Candidate>>(`/candidates?page=${page}`)
      return response.data
    },
    staleTime: STALE_TIMES.LIST,
  })
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CANDIDATES.DETAIL(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Candidate>>(`/candidates/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DETAIL,
    refetchInterval: (query) => {
      const data = query.state.data
      const status = data?.data?.extraction_status as ProcessingStatus | undefined
      if (status === 'processing' || status === 'pending') {
        return 3000 // Poll every 3 seconds while processing
      }
      return false
    },
  })
}

export function useUploadCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post<ApiResponse<Candidate>>('/candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
