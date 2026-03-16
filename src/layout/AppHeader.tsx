import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useSidebar } from '@/context/SidebarContext'

export default function AppHeader() {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar()
  const navigate = useNavigate()

  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar()
    } else {
      toggleMobileSidebar()
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-[99999] dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex items-center justify-between flex-grow px-4 py-3 lg:px-6 lg:py-4">
        {/* Left: hamburger */}
        <button
          className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg dark:text-gray-400 lg:h-11 lg:w-11 lg:border lg:border-gray-200 dark:lg:border-gray-800"
          onClick={handleToggle}
        >
          {isMobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.22 7.28a.75.75 0 011.06-1.06L12 10.94l4.72-4.72a.75.75 0 111.06 1.06L13.06 12l4.72 4.72a.75.75 0 11-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 01-1.06-1.06L10.94 12 6.22 7.28z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M.583 1a.75.75 0 01.75-.75h13.334a.75.75 0 010 1.5H1.333A.75.75 0 01.583 1zm0 10a.75.75 0 01.75-.75h13.334a.75.75 0 010 1.5H1.333A.75.75 0 01.583 11zm.75-5.75a.75.75 0 000 1.5H8a.75.75 0 000-1.5H1.333z" fill="currentColor" />
            </svg>
          )}
        </button>

        {/* Right: theme toggle + logout */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
