import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
