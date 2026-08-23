import { Navigate } from 'react-router-dom'
import { defaultHomePath, isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import Onboarding from '../../pages/Onboarding'

export function OnboardingPage() {
  if (isOnboardingCompleteInStorage()) {
    return <Navigate to={defaultHomePath()} replace />
  }
  return <Onboarding />
}

export function RootRedirect() {
  if (!isOnboardingCompleteInStorage()) {
    return <Navigate to="/onboarding" replace />
  }
  return <Navigate to={defaultHomePath()} replace />
}
