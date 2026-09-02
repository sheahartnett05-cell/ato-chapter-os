import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { CloudBootstrap } from './components/routing/CloudBootstrap'
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
import { BudgetProvider } from './context/BudgetContext'
import { JoinPage, OnboardingPage, PreviewPage, RootRedirect } from './components/routing/OnboardingPage'
import { ExecShell, MemberShell, SettingsShellPage, AdaptiveShell } from './components/routing/AppShells'
import { FeatureRoute } from './components/routing/FeatureRoute'
import { DuesSyncBridge } from './components/routing/DuesSyncBridge'
import { AttendanceSyncBridge } from './components/routing/AttendanceSyncBridge'
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
    <CloudBootstrap>
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
                              <DuesSyncBridge />
                              <AttendanceSyncBridge />
                              <BrowserRouter>
                                <Routes>
                                  <Route path="/preview" element={<PreviewPage />} />
                                  <Route path="/login" element={<PreviewPage />} />
                                  <Route path="/join" element={<JoinPage />} />
                                  <Route path="/join/:code" element={<JoinPage />} />
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
                                        <FeatureRoute feature="announcements">
                                          <Announcements />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/members"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="roster">
                                          <MemberManagement />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/members/:id"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="roster">
                                          <MemberProfile />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/calendar"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="calendar">
                                          <CalendarPage />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/events/:id"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="calendar">
                                          <EventPage />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/excuses"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="calendar">
                                          <ExcuseApprovals />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/library-hours"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="studyHours">
                                          <LibraryHours />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/dues"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="dues">
                                          <DuesPage />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/budgets"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="budgets">
                                          <BudgetsIndex />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/budgets/:id"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="budgets">
                                          <BudgetDetail />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/budget"
                                    element={<Navigate to="/budgets" replace />}
                                  />
                                  <Route
                                    path="/tables"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="tables">
                                          <TablesIndex />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/tables/:id"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="tables">
                                          <ChapterTables />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/recruitment"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="recruitment">
                                          <RecruitmentDashboard />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/recruitment/pipeline"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="recruitment">
                                          <RecruitmentPipeline />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/recruitment/pnm/:id"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="recruitment">
                                          <PNMProfile />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/standards"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="standards">
                                          <JudicialBoard />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/standards/setup"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="standards">
                                          <StandardsSetupPage />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/judicial-board"
                                    element={<Navigate to="/standards" replace />}
                                  />
                                  <Route
                                    path="/committees"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="committees">
                                          <Committees />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/committees/:id"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="committees">
                                          <CommitteeDetail />
                                        </FeatureRoute>
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
                                        <FeatureRoute feature="execSlides">
                                          <ExecSlides />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/bylaws"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="bylaws">
                                          <BylawsPage />
                                        </FeatureRoute>
                                      </AdaptiveShell>
                                    }
                                  />
                                  <Route
                                    path="/house"
                                    element={
                                      <AdaptiveShell>
                                        <FeatureRoute feature="house">
                                          <HouseMaintenancePage />
                                        </FeatureRoute>
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

                                  <Route
                                    path="/settings/governance"
                                    element={<Navigate to="/settings" replace />}
                                  />
                                  <Route
                                    path="/chapter-room"
                                    element={<Navigate to="/my-dashboard" replace />}
                                  />
                                  <Route
                                    path="/organizations"
                                    element={<Navigate to="/home" replace />}
                                  />
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
    </CloudBootstrap>
  )
}
