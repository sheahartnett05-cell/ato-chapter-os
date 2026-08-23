import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-tint)' }}>
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="theme-stripe sticky top-0 z-40" />
        <div className="min-h-[calc(100vh-3px)] bg-white/60 backdrop-blur-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
