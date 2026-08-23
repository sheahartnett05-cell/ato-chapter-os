import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '../../context/AuthContext'

/** Exec shell — members use /my-dashboard instead */
export function RequireExec() {
  const { isMemberView } = usePermissions()
  if (isMemberView) return <Navigate to="/my-dashboard" replace />
  return <Outlet />
}
