import { useSyncExternalStore } from 'react'
import { getPersistError, subscribePersistError } from '../../lib/persist'

export function PersistErrorNotice() {
  const error = useSyncExternalStore(subscribePersistError, getPersistError, () => null)
  if (!error) return null
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error}
    </p>
  )
}
