import { Outlet } from 'react-router'
import { SidebarProvider } from '@/context/SidebarContext'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import Backdrop from './Backdrop'

function LayoutContent() {
  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div className="flex-1 lg:ml-[290px]">
        <AppHeader />
        <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}
