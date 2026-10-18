import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../layout/TopBar'
import { PageShell } from '../ui/Section'
import { useChapterFeaturesOptional } from '../../context/ChapterFeaturesContext'
import { CHAPTER_FEATURES, type ChapterFeatureId } from '../../types/chapterFeatures'
import { usePermissions } from '../../context/AuthContext'

function featureLabel(id: ChapterFeatureId): string {
  return CHAPTER_FEATURES.find((f) => f.id === id)?.label ?? id
}

function FeatureDisabledPage({ feature }: { feature: ChapterFeatureId }) {
  const permissions = usePermissions()
  const label = featureLabel(feature)

  return (
    <>
      <TopBar title={label} showBrand={false} />
      <PageShell>
        <div className="mx-auto max-w-md space-y-4 border border-[var(--rule)] bg-[var(--surface-card)] px-6 py-8 text-center">
          <p className="font-serif text-xl tracking-tight text-[var(--ink)]">Not available</p>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--ink)]">{label}</span> is turned off for this
            chapter. Officers can re-enable it in Chapter Setup.
          </p>
          {permissions.canAccessAdminSettings ? (
            <Link to="/chapter-setup" className="btn-primary inline-block text-sm">
              Open Chapter Setup
            </Link>
          ) : (
            <Link to="/my-dashboard" className="btn-ghost inline-block text-sm">
              Back to Chapter Room
            </Link>
          )}
        </div>
      </PageShell>
    </>
  )
}

/** Block when a chapter feature is disabled (routes stay hidden from sidebar too). */
export function FeatureRoute({
  feature,
  children,
}: {
  feature: ChapterFeatureId
  children: ReactNode
}) {
  const features = useChapterFeaturesOptional()
  const enabled = features?.isFeatureEnabled(feature) ?? true
  if (!enabled) return <FeatureDisabledPage feature={feature} />
  return children
}
