import { createContext, useContext, useState, useCallback } from 'react'
import { login as apiLogin } from '@/api/auth'

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('token')
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    setToken(response.token)
    localStorage.setItem('token', response.token)
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
