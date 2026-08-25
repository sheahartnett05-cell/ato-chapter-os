import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChapterProvider } from './context/ChapterContext'
import { ChapterPositionsProvider } from './context/ChapterPositionsContext'
import { ChapterFeaturesProvider } from './context/ChapterFeaturesContext'
import { GovernanceProvider } from './context/GovernanceContext'
import { MembersProvider } from './context/MembersContext'
import { ChapterOpsProvider } from './context/ChapterOpsContext'
import { CommunicationsProvider } from './context/CommunicationsContext'
import { ChapterResourcesProvider } from './context/ChapterResourcesContext'
import { ChapterTablesProvider } from './context/ChapterTablesContext'
import { RecruitmentProvider } from './context/RecruitmentContext'
import { OnboardingPage, PreviewPage, RootRedirect } from './components/routing/OnboardingPage'
import { ExecShell, MemberShell, SettingsShellPage, AdaptiveShell } from './components/routing/AppShells'
import { BudgetProvider } from './context/BudgetContext'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import MemberManagement from './pages/MemberManagement'
import MemberProfile from './pages/MemberProfile'
import MyProfile from './pages/MyProfile'
import EventPage from './pages/EventPage'
import ChapterTables from './pages/ChapterTables'
import TablesIndex from './pages/TablesIndex'
import RecruitmentDashboard from './pages/RecruitmentDashboard'
import RecruitmentPipeline from './pages/RecruitmentPipeline'
import PNMProfile from './pages/PNMProfile'
import MemberDashboard from './pages/MemberDashboard'
import Announcements from './pages/Announcements'
import ExcuseApprovals from './pages/ExcuseApprovals'
import LibraryHours from './pages/LibraryHours'
import ChapterSetup from './pages/ChapterSetup'
import ExecSlides from './pages/ExecSlides'
import BylawsPage from './pages/Bylaws'
import HouseMaintenancePage from './pages/HouseMaintenance'
import JudicialBoard from './pages/JudicialBoard'
import StandardsSetupPage from './pages/StandardsSetup'
import Committees from './pages/Committees'
import CommitteeDetail from './pages/CommitteeDetail'
import Settings from './pages/Settings'
import CalendarPage from './pages/Calendar'
import DuesPage from './pages/Dues'
import BudgetsIndex from './pages/BudgetsIndex'
import BudgetDetail from './pages/BudgetDetail'

export default function App() {
  return (
    <ChapterProvider>
      <MembersProvider>
        <ChapterPositionsProvider>
        <ChapterFeaturesProvider>
        <AuthProvider>
          <GovernanceProvider>
            <CommunicationsProvider>
            <ChapterResourcesProvider>
            <ChapterTablesProvider>
            <RecruitmentProvider>
            <ChapterOpsProvider>
              <BudgetProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/preview" element={<PreviewPage />} />
                <Route path="/login" element={<PreviewPage />} />
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
                    <ExecShell>
                      <LibraryHours />
                    </ExecShell>
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
                  path="/budgets"
                  element={
                    <ExecShell>
                      <BudgetsIndex />
                    </ExecShell>
                  }
                />
                <Route
                  path="/budgets/:id"
                  element={
                    <ExecShell>
                      <BudgetDetail />
                    </ExecShell>
                  }
                />
                <Route
                  path="/tables"
                  element={
                    <ExecShell>
                      <TablesIndex />
                    </ExecShell>
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
                  path="/standards"
                  element={
                    <ExecShell>
                      <JudicialBoard />
                    </ExecShell>
                  }
                />
                <Route
                  path="/standards/setup"
                  element={
                    <ExecShell>
                      <StandardsSetupPage />
                    </ExecShell>
                  }
                />
                <Route path="/judicial-board" element={<Navigate to="/standards" replace />} />
                <Route
                  path="/committees"
                  element={
                    <AdaptiveShell>
                      <Committees />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/committees/:id"
                  element={
                    <AdaptiveShell>
                      <CommitteeDetail />
                    </AdaptiveShell>
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
                  path="/bylaws"
                  element={
                    <AdaptiveShell>
                      <BylawsPage />
                    </AdaptiveShell>
                  }
                />
                <Route
                  path="/house"
                  element={
                    <AdaptiveShell>
                      <HouseMaintenancePage />
                    </AdaptiveShell>
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
              </BudgetProvider>
            </ChapterOpsProvider>
            </RecruitmentProvider>
            </ChapterTablesProvider>
            </ChapterResourcesProvider>
            </CommunicationsProvider>
          </GovernanceProvider>
        </AuthProvider>
        </ChapterFeaturesProvider>
        </ChapterPositionsProvider>
      </MembersProvider>
    </ChapterProvider>
  )
}
