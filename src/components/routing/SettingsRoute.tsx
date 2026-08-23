import { usePermissions } from '../../context/AuthContext'
import { Sidebar } from '../layout/Sidebar'
import Settings from '../../pages/Settings'

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-tint)' }}>
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="theme-stripe sticky top-0 z-40" />
        <div className="min-h-[calc(100vh-3px)] bg-white/60 backdrop-blur-sm">{children}</div>
      </main>
    </div>
  )
}

/** Exec → sidebar shell; members → standalone page */
export function SettingsRoute() {
  const { isMemberView } = usePermissions()
  if (isMemberView) return <Settings />
  return (
    <SettingsShell>
      <Settings />
    </SettingsShell>
  )
}
