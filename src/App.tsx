import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import SearchPage from '@/pages/SearchPage'
import ArtistPage from '@/pages/ArtistPage'
import ReleasePage from '@/pages/ReleasePage'
import ImportHistoryPage from '@/pages/ImportHistoryPage'
import SystemMonitorPage from '@/pages/SystemMonitorPage'
import StatisticsPage from '@/pages/StatisticsPage'
import FallbacksPage from '@/pages/FallbacksPage'
import DbHealthPage from '@/pages/DbHealthPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/search" /> : <LoginPage />}
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
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/fallbacks" element={<FallbacksPage />} />
        <Route path="/imports" element={<ImportHistoryPage />} />
        <Route path="/db-health" element={<DbHealthPage />} />
        <Route path="/monitor" element={<SystemMonitorPage />} />
      </Route>
    </Routes>
  )
}
