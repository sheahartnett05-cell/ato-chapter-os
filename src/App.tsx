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
import { DemoPage, JoinPage, OnboardingPage, PreviewPage, RootRedirect } from './components/routing/OnboardingPage'
import { ExecShell, MemberShell, SharedShell } from './components/routing/AppShells'
import { ChapterViewModeProvider } from './context/ChapterViewModeContext'
import { FeatureRoute } from './components/routing/FeatureRoute'
import { DuesSyncBridge } from './components/routing/DuesSyncBridge'
import { AttendanceSyncBridge } from './components/routing/AttendanceSyncBridge'
import { ToastProvider } from './components/ui/Toast'
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
import AttendanceTracker from './pages/AttendanceTracker'
import CheckInPage from './pages/CheckIn'
import LibraryHours from './pages/LibraryHours'
import ChapterSetup from './pages/ChapterSetup'
import ChapterMeetingPage from './pages/ChapterMeeting'
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
                <ChapterViewModeProvider>
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
                                <ToastProvider>
                                <Routes>
                                  <Route path="/preview" element={<PreviewPage />} />
                                  <Route path="/login" element={<PreviewPage />} />
                                  <Route path="/demo" element={<DemoPage />} />
                                  <Route path="/check-in/:eventId" element={<CheckInPage />} />
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
                                      <SharedShell>
                                        <FeatureRoute feature="announcements">
                                          <Announcements />
                                        </FeatureRoute>
                                      </SharedShell>
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
                                        <MemberProfile />
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/calendar"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="calendar">
                                          <CalendarPage />
                                        </FeatureRoute>
                                      </SharedShell>
                                    }
                                  />
                                  <Route
                                    path="/events/:id"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="calendar">
                                          <EventPage />
                                        </FeatureRoute>
                                      </SharedShell>
                                    }
                                  />
                                  <Route
                                    path="/attendance"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="attendancePoints">
                                          <AttendanceTracker />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/excuses"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="attendancePoints">
                                          <ExcuseApprovals />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/library-hours"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="studyHours">
                                          <LibraryHours />
                                        </FeatureRoute>
                                      </SharedShell>
                                    }
                                  />
                                  <Route
                                    path="/dues"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="dues">
                                          <DuesPage />
                                        </FeatureRoute>
                                      </SharedShell>
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
                                      <SharedShell>
                                        <FeatureRoute feature="committees">
                                          <Committees />
                                        </FeatureRoute>
                                      </SharedShell>
                                    }
                                  />
                                  <Route
                                    path="/committees/:id"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="committees">
                                          <CommitteeDetail />
                                        </FeatureRoute>
                                      </SharedShell>
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
                                    path="/chapter-meeting"
                                    element={
                                      <ExecShell>
                                        <FeatureRoute feature="execSlides">
                                          <ChapterMeetingPage />
                                        </FeatureRoute>
                                      </ExecShell>
                                    }
                                  />
                                  <Route
                                    path="/exec-slides"
                                    element={<Navigate to="/chapter-meeting" replace />}
                                  />
                                  <Route
                                    path="/bylaws"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="bylaws">
                                          <BylawsPage />
                                        </FeatureRoute>
                                      </SharedShell>
                                    }
                                  />
                                  <Route
                                    path="/house"
                                    element={
                                      <SharedShell>
                                        <FeatureRoute feature="house">
                                          <HouseMaintenancePage />
                                        </FeatureRoute>
                                      </SharedShell>
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
                                      <SharedShell>
                                        <Settings />
                                      </SharedShell>
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
                                </ToastProvider>
                              </BrowserRouter>
                            </BudgetProvider>
                          </ChapterOpsProvider>
                        </RecruitmentProvider>
                      </ChapterTablesProvider>
                    </ChapterResourcesProvider>
                  </CommunicationsProvider>
                  </GovernanceProvider>
                </ChapterViewModeProvider>
              </AuthProvider>
            </ChapterFeaturesProvider>
          </ChapterPositionsProvider>
        </MembersProvider>
      </ChapterProvider>
    </CloudBootstrap>
  )
}
