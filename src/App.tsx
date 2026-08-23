import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import MemberManagement from './pages/MemberManagement'
import MemberProfile from './pages/MemberProfile'
import EventPage from './pages/EventPage'
import ChapterTables from './pages/ChapterTables'
import RecruitmentDashboard from './pages/RecruitmentDashboard'
import RecruitmentPipeline from './pages/RecruitmentPipeline'
import PNMProfile from './pages/PNMProfile'
import MemberDashboard from './pages/MemberDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ExecutiveDashboard />} />
          <Route path="/members" element={<MemberManagement />} />
          <Route path="/members/:id" element={<MemberProfile />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/tables/:id" element={<ChapterTables />} />
          <Route path="/recruitment" element={<RecruitmentDashboard />} />
          <Route path="/recruitment/pipeline" element={<RecruitmentPipeline />} />
          <Route path="/recruitment/pnm/:id" element={<PNMProfile />} />
        </Route>
        <Route path="/my-dashboard" element={<MemberDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
