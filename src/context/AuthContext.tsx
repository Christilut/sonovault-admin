import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin } from '@/api/auth'
import { apiClient } from '@/api/client'

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('token'))

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('token')
  }, [])

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    apiClient.get('/admin/stats').catch(() => {
      logout()
    }).finally(() => {
      setIsLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    setToken(response.token)
    localStorage.setItem('token', response.token)
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
