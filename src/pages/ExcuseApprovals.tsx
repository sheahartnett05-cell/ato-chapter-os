import { Navigate, useLocation } from 'react-router-dom'

/** Legacy route — merged into Attendance & Excuses. */
export default function ExcuseApprovals() {
  const location = useLocation()
  const q = new URLSearchParams(location.search)
  q.set('tab', 'excuses')
  return <Navigate to={`/attendance?${q.toString()}`} replace />
}
