import { useState, createContext, useContext, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { User, LoginRequest, LoginResponse, ApiResponse } from '../lib/types'
import { ROUTES, STORAGE_KEYS, QUERY_KEYS } from '../lib/constants'
import { useNavigate } from 'react-router'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  )
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: userResponse, isLoading: isLoadingUser, isFetching } = useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: async () => {
      console.log('[AuthProvider] Fetching user data...');
      const response = await apiClient.get<ApiResponse<User>>('/auth/me')
      console.log('[AuthProvider] User data fetched:', response.data);
      return response.data
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    throwOnError: false,
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        ...credentials,
        device_name: credentials.device_name || 'web-dashboard',
      })
      return response.data
    },
    onSuccess: (response) => {
      const newToken = response.token
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken)
      setToken(newToken)
      // Set the user data immediately in cache
      queryClient.setQueryData(QUERY_KEYS.AUTH.ME, { data: response.user })
      // Force a page reload to dashboard to ensure clean state
      window.location.href = ROUTES.DASHBOARD
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
    onSettled: () => {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      setToken(null)
      queryClient.clear()
      navigate(ROUTES.LOGIN)
    },
  })

  const login = useCallback(
    async (credentials: LoginRequest) => {
      await loginMutation.mutateAsync(credentials)
    },
    [loginMutation]
  )

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const value = useMemo<AuthContextType>(
    () => {
      const val = {
        user: userResponse?.data ?? null,
        isLoading: (!!token && (isLoadingUser || isFetching)) || loginMutation.isPending || logoutMutation.isPending,
        isAuthenticated: !!token && !!userResponse?.data,
        login,
        logout,
      }
      console.log('[AuthProvider]', { 
        hasToken: !!token, 
        isLoadingUser,
        isFetching,
        hasUser: !!userResponse?.data,
        isLoading: val.isLoading,
        isAuthenticated: val.isAuthenticated 
      });
      return val;
    },
    [token, userResponse, isLoadingUser, isFetching, loginMutation.isPending, logoutMutation.isPending, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
