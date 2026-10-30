import { Navigate, useLocation, useParams } from 'react-router-dom'
import { defaultHomePath, isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import {
  normalizeJoinCode,
  parseJoinCodeFromSearch,
} from '../../lib/joinLinks'
import Onboarding from '../../pages/Onboarding'
import Landing from '../../pages/Landing'
import DemoPreview from '../../pages/DemoPreview'

export function OnboardingPage() {
  if (isOnboardingCompleteInStorage()) {
    return <Navigate to={defaultHomePath()} replace />
  }
  return <Onboarding />
}

/** Deep link entry — /join?code=… or /join/CHAPTER-JOIN-… → onboarding with code prefilled */
export function JoinPage() {
  const location = useLocation()
  const params = useParams<{ code?: string }>()
  const fromPath = params.code ? normalizeJoinCode(decodeURIComponent(params.code)) : null
  const code = fromPath ?? parseJoinCodeFromSearch(location.search)

  if (isOnboardingCompleteInStorage()) {
    return <Navigate to={defaultHomePath()} replace />
  }

  if (!code) {
    return <Navigate to="/onboarding" replace />
  }

  return <Navigate to={`/onboarding?code=${encodeURIComponent(code)}`} replace />
}

/** Front door. Reachable even when a chapter session already exists. */
export function PreviewPage() {
  return <Landing />
}

/** Demo is its own short path, separate from creating an account. */
export function DemoPage() {
  return <DemoPreview />
}

export function RootRedirect() {
  if (!isOnboardingCompleteInStorage()) {
    return <Landing />
  }
  return <Navigate to={defaultHomePath()} replace />
}
