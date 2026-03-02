import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { JobOffer, PaginatedResponse, ApiResponse, CreateJobOfferRequest } from '../../lib/types'
import { QUERY_KEYS, STALE_TIMES } from '../../lib/constants'

export function useJobOffers(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_OFFERS.LIST(page),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<JobOffer>>(`/job-offers?page=${page}`)
      return response.data
    },
    staleTime: STALE_TIMES.LIST,
  })
}

export function useJobOffer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_OFFERS.DETAIL(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<JobOffer>>(`/job-offers/${id}`)
      return response.data
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DETAIL,
  })
}

export function useCreateJobOffer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateJobOfferRequest) => {
      const response = await apiClient.post<ApiResponse<JobOffer>>('/job-offers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-offers'] })
    },
  })
}
