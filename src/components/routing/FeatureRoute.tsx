import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useChapterFeaturesOptional } from '../../context/ChapterFeaturesContext'
import type { ChapterFeatureId } from '../../types/chapterFeatures'
import { defaultHomePath } from '../../lib/onboardingStorage'

/** Redirect when a chapter feature is disabled (routes stay hidden from sidebar too). */
export function FeatureRoute({
  feature,
  children,
}: {
  feature: ChapterFeatureId
  children: ReactNode
}) {
  const features = useChapterFeaturesOptional()
  const enabled = features?.isFeatureEnabled(feature) ?? true
  if (!enabled) return <Navigate to={defaultHomePath()} replace />
  return children
}
