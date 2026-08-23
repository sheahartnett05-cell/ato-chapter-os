import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChapterProvider } from './context/ChapterContext'
import { GovernanceProvider } from './context/GovernanceContext'
import { MembersProvider } from './context/MembersContext'
import { ChapterOpsProvider } from './context/ChapterOpsContext'
import { CommunicationsProvider } from './context/CommunicationsContext'
import { OnboardingPage, RootRedirect } from './components/routing/OnboardingPage'
import { ExecShell, MemberShell, SettingsShellPage, AdaptiveShell } from './components/routing/AppShells'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import MemberManagement from './pages/MemberManagement'
import MemberProfile from './pages/MemberProfile'
import MyProfile from './pages/MyProfile'
import EventPage from './pages/EventPage'
import ChapterTables from './pages/ChapterTables'
import RecruitmentDashboard from './pages/RecruitmentDashboard'
import RecruitmentPipeline from './pages/RecruitmentPipeline'
import PNMProfile from './pages/PNMProfile'
import MemberDashboard from './pages/MemberDashboard'
import Announcements from './pages/Announcements'
import ExcuseApprovals from './pages/ExcuseApprovals'
import LibraryHours from './pages/LibraryHours'
import ChapterSetup from './pages/ChapterSetup'
import ExecSlides from './pages/ExecSlides'
import JudicialBoard from './pages/JudicialBoard'
import Committees from './pages/Committees'
import CommitteeDetail from './pages/CommitteeDetail'
import Settings from './pages/Settings'
import CalendarPage from './pages/Calendar'
import DuesPage from './pages/Dues'

export default function App() {
  return (
    <ChapterProvider>
      <MembersProvider>
        <AuthProvider>
          <GovernanceProvider>
            <CommunicationsProvider>
            <ChapterOpsProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/" element={<RootRedirect />} />

                <Route
                  path="/home"
                  element={
                    <ExecShell>
                      <ExecutiveDashboard />
                    </ExecShell>
                  }
                />
                <Route
                  path="/announcements"
                  element={
                    <AdaptiveShell>
                      <Announcements />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/members"
                  element={
                    <ExecShell>
                      <MemberManagement />
                    </ExecShell>
                  }
                />
                <Route
                  path="/members/:id"
                  element={
                    <ExecShell>
                      <MemberProfile />
                    </ExecShell>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <AdaptiveShell>
                      <CalendarPage />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/events/:id"
                  element={
                    <AdaptiveShell>
                      <EventPage />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/excuses"
                  element={
                    <ExecShell>
                      <ExcuseApprovals />
                    </ExecShell>
                  }
                />
                <Route
                  path="/library-hours"
                  element={
                    <AdaptiveShell>
                      <LibraryHours />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/dues"
                  element={
                    <AdaptiveShell>
                      <DuesPage />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/tables/:id"
                  element={
                    <ExecShell>
                      <ChapterTables />
                    </ExecShell>
                  }
                />
                <Route
                  path="/recruitment"
                  element={
                    <ExecShell>
                      <RecruitmentDashboard />
                    </ExecShell>
                  }
                />
                <Route
                  path="/recruitment/pipeline"
                  element={
                    <ExecShell>
                      <RecruitmentPipeline />
                    </ExecShell>
                  }
                />
                <Route
                  path="/recruitment/pnm/:id"
                  element={
                    <ExecShell>
                      <PNMProfile />
                    </ExecShell>
                  }
                />
                <Route
                  path="/judicial-board"
                  element={
                    <ExecShell>
                      <JudicialBoard />
                    </ExecShell>
                  }
                />
                <Route
                  path="/committees"
                  element={
                    <ExecShell>
                      <Committees />
                    </ExecShell>
                  }
                />
                <Route
                  path="/committees/:id"
                  element={
                    <ExecShell>
                      <CommitteeDetail />
                    </ExecShell>
                  }
                />
                <Route
                  path="/chapter-setup"
                  element={
                    <ExecShell>
                      <ChapterSetup />
                    </ExecShell>
                  }
                />
                <Route
                  path="/exec-slides"
                  element={
                    <ExecShell>
                      <ExecSlides />
                    </ExecShell>
                  }
                />

                <Route
                  path="/my-dashboard"
                  element={
                    <MemberShell>
                      <MemberDashboard />
                    </MemberShell>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <MemberShell>
                      <MyProfile />
                    </MemberShell>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <SettingsShellPage>
                      <Settings />
                    </SettingsShellPage>
                  }
                />

                <Route path="/settings/governance" element={<Navigate to="/settings" replace />} />
                <Route path="/chapter-room" element={<Navigate to="/my-dashboard" replace />} />
                <Route path="/organizations" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </BrowserRouter>
            </ChapterOpsProvider>
            </CommunicationsProvider>
          </GovernanceProvider>
        </AuthProvider>
      </MembersProvider>
    </ChapterProvider>
  )
}
