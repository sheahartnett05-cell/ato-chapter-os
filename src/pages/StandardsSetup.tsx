import { Link, Navigate, useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { StandardsSetupWizard } from '../components/standards/StandardsSetupWizard'
import { usePermissions } from '../context/AuthContext'
import { useGovernance } from '../context/GovernanceContext'
import { writeStandardsConfig } from '../lib/standardsConfigStorage'
import { readStandardsConfig } from '../lib/standardsConfigStorage'
import { notifyStandardsConfigSaved } from '../hooks/useStandardsModuleConfig'
import type { FineScheduleRule, JBoardCategory } from '../types/governance'
import type { FineMatrixItem, StandardsConfigEnvelope } from '../types/standardsConfig'

function guessCategory(title: string): JBoardCategory {
  const t = title.toLowerCase()
  if (t.includes('absence') || t.includes('missed')) return 'Unexcused Absence'
  if (t.includes('risk') || t.includes('sober') || t.includes('monitor')) return 'Risk Violation'
  if (t.includes('damage') || t.includes('property')) return 'Property Damage'
  return 'Conduct'
}

function matrixToFineSchedule(matrix: FineMatrixItem[]): FineScheduleRule[] {
  return matrix
    .filter((r) => r.is_active && r.title.trim())
    .map((r) => ({
      id: r.id,
      label: r.title,
      amount: r.fine_amount,
      category: guessCategory(r.title),
    }))
}

export default function StandardsSetupPage() {
  const permissions = usePermissions()
  const navigate = useNavigate()
  const { updateConfig, updateFineSchedule } = useGovernance()
  const initial = readStandardsConfig()

  if (!permissions.canAccessAdminSettings && !permissions.canAccessJBoardSettings) {
    return <Navigate to="/home" replace />
  }

  const handleComplete = (envelope: StandardsConfigEnvelope) => {
    const cfg = envelope.standards_config
    writeStandardsConfig(cfg)
    notifyStandardsConfigSaved()
    updateConfig({ casesHiddenFromMembers: cfg.privacy_enabled })
    updateFineSchedule(matrixToFineSchedule(cfg.fine_matrix))
    navigate('/standards', { replace: true, state: { standardsConfigured: true } })
  }

  return (
    <>
      <TopBar
        title="Standards module setup"
        subtitle="3-step wizard · Terminology · Rulebook · Appeals"
        actions={
          <Link
            to="/standards"
            className="rounded-sm border border-[var(--rule)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-black/[0.02]"
          >
            Skip to module
          </Link>
        }
      />
      <StandardsSetupWizard
        initialConfig={initial}
        onComplete={handleComplete}
        onCancel={() => navigate('/standards')}
      />
    </>
  )
}
