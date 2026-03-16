import { Link, useLocation } from 'react-router'
import { useSidebar } from '@/context/SidebarContext'

const navItems = [
  { path: '/search', label: 'Search' },
  { path: '/imports', label: 'Import History' },
  { path: '/monitor', label: 'System Monitor' }
]

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar()
  const location = useLocation()

  const showText = isExpanded || isHovered || isMobileOpen

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        showText ? 'w-[290px]' : 'w-[90px]'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!showText ? 'lg:justify-center' : 'justify-start'}`}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          {showText && (
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Music DB
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col overflow-y-auto no-scrollbar">
        <div>
          <h2
            className={`mb-4 text-xs uppercase leading-5 text-gray-400 flex ${
              !showText ? 'lg:justify-center' : 'justify-start'
            }`}
          >
            {showText ? 'Menu' : '···'}
          </h2>
          <ul className="flex flex-col gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`menu-item ${active ? 'menu-item-active' : 'menu-item-inactive'} ${
                      !showText ? 'lg:justify-center' : ''
                    }`}
                  >
                    {showText && <span>{item.label}</span>}
                    {!showText && (
                      <span className="text-xs font-bold">{item.label.charAt(0)}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </aside>
  )
}
