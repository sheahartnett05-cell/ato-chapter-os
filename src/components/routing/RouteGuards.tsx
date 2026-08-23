import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Blocks app shell until onboarding is complete */
export function RequireOnboarding() {
  const { isOnboarded } = useAuth()
  if (!isOnboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
