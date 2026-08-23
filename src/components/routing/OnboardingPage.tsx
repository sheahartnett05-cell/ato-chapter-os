import { Navigate } from 'react-router-dom'
import { defaultHomePath, isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import Onboarding from '../../pages/Onboarding'
import GuestLogin from '../../pages/GuestLogin'

export function OnboardingPage() {
  if (isOnboardingCompleteInStorage()) {
    return <Navigate to={defaultHomePath()} replace />
  }
  return <Onboarding />
}

/** Collaborator / demo entry — no invite required */
export function PreviewPage() {
  if (isOnboardingCompleteInStorage()) {
    return <Navigate to={defaultHomePath()} replace />
  }
  return <GuestLogin />
}

export function RootRedirect() {
  if (!isOnboardingCompleteInStorage()) {
    return <Navigate to="/preview" replace />
  }
  return <Navigate to={defaultHomePath()} replace />
}
