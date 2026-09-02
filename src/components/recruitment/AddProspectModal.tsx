import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { PhotoUpload } from '../ui/PhotoUpload'
import { getRushTemplate, type RushFormField } from '../../data/rushFormTemplates'
import { useRecruitment } from '../../context/RecruitmentContext'
import { isLikelyEmail } from '../../lib/formUtils'

type FormValues = Record<string, string | boolean | number | string[]>

function defaultValue(field: RushFormField): string | boolean | number {
  if (field.type === 'checkbox') return false
  if (field.type === 'number') return new Date().getFullYear() + 1
  if (field.type === 'tags') return ''
  return ''
}

function FieldInput({
  field,
  value,
  onChange,
  initials,
}: {
  field: RushFormField
  value: string | boolean | number | string[] | undefined
  onChange: (v: string | boolean | number | string[]) => void
  initials: string
}) {
  if (field.type === 'photo') {
    return (
      <PhotoUpload
        value={typeof value === 'string' ? value : undefined}
        initials={initials}
        onChange={(url) => onChange(url ?? '')}
        size="lg"
      />
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="input-editorial w-full resize-none"
      />
    )
  }

  if (field.type === 'dropdown' && field.options) {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="input-editorial w-full"
      >
        <option value="">Select…</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-[var(--rule)] text-[var(--accent)]"
      />
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={Number(value) || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-editorial w-full font-mono"
      />
    )
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="input-editorial w-full"
      />
    )
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="input-editorial w-full"
    />
  )
}

interface AddProspectModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (prospectId: string) => void
  defaultTemplateId?: string
}

export function AddProspectModal({
  open,
  onClose,
  onCreated,
  defaultTemplateId = 'standard-intake',
}: AddProspectModalProps) {
  const { templates, addProspectFromForm } = useRecruitment()
  const [templateId, setTemplateId] = useState(defaultTemplateId)
  const [values, setValues] = useState<FormValues>({})
  const [submitError, setSubmitError] = useState('')

  const template = getRushTemplate(templateId)

  const initials = useMemo(() => {
    const f = String(values.firstName ?? '')
    const l = String(values.lastName ?? '')
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || '?'
  }, [values.firstName, values.lastName])

  const setField = (id: string, v: string | boolean | number | string[]) => {
    setValues((prev) => ({ ...prev, [id]: v }))
  }

  const reset = () => {
    setValues({})
    setTemplateId(defaultTemplateId)
    setSubmitError('')
  }

  const emailValue = String(values.email ?? '')
  const emailInvalid = emailValue.trim() !== '' && !isLikelyEmail(emailValue)

  const canSubmit =
    template?.fields
      .filter((f) => f.required && f.type !== 'photo')
      .every((f) => {
        const v = values[f.id]
        return v !== undefined && v !== ''
      }) && !emailInvalid

  const handleSubmit = () => {
    if (!canSubmit) return
    if (emailValue.trim() && !isLikelyEmail(emailValue)) {
      setSubmitError('Enter a valid email address.')
      return
    }
    setSubmitError('')
    const prospect = addProspectFromForm(templateId, values)
    reset()
    onClose()
    onCreated?.(prospect.id)
  }

  const switchTemplate = (id: string) => {
    setTemplateId(id)
    setValues({})
  }

  return (
    <Modal open={open} onClose={onClose} title="Add PNM">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Intake template
          </label>
          <select
            value={templateId}
            onChange={(e) => switchTemplate(e.target.value)}
            className="input-editorial mt-1 w-full"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {template && (
            <p className="mt-1 text-xs text-[var(--muted)]">{template.description}</p>
          )}
        </div>

        {template?.fields.map((field) => (
          <label key={field.id} className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {field.name}
              {field.required ? ' *' : ''}
            </span>
            <div className="mt-1">
              <FieldInput
                field={field}
                value={values[field.id] ?? defaultValue(field)}
                onChange={(v) => setField(field.id, v)}
                initials={initials}
              />
            </div>
          </label>
        ))}

        {submitError && <p className="text-sm text-red-700">{submitError}</p>}
        {emailInvalid && !submitError && (
          <p className="text-sm text-red-700">Enter a valid email address.</p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="btn-primary w-full disabled:opacity-50"
        >
          Add to pipeline
        </button>
      </div>
    </Modal>
  )
}
