import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import SearchPage from '@/pages/SearchPage'
import ArtistPage from '@/pages/ArtistPage'
import ReleasePage from '@/pages/ReleasePage'
import ImportHistoryPage from '@/pages/ImportHistoryPage'
import SystemMonitorPage from '@/pages/SystemMonitorPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoading ? null : isAuthenticated ? <Navigate to="/search" /> : <LoginPage />
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/search" />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/artists/:id" element={<ArtistPage />} />
        <Route path="/releases/:id" element={<ReleasePage />} />
        <Route path="/imports" element={<ImportHistoryPage />} />
        <Route path="/monitor" element={<SystemMonitorPage />} />
      </Route>
    </Routes>
  )
}
