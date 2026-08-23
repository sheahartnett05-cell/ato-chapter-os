import { useCallback, useEffect, useState } from 'react'
import {
  defaultStandardsConfig,
  type StandardsConfig,
  type StandardsConfigEnvelope,
} from '../types/standardsConfig'
import {
  readStandardsConfig,
  writeStandardsConfig,
} from '../lib/standardsConfigStorage'

const CHANGE_EVENT = 'chapter-os-standards-config-changed'

function emitChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useStandardsModuleConfig() {
  const [config, setConfig] = useState<StandardsConfig>(
    () => readStandardsConfig() ?? defaultStandardsConfig()
  )
  const [configured, setConfigured] = useState(() => readStandardsConfig() !== null)

  const syncFromStorage = useCallback(() => {
    const stored = readStandardsConfig()
    setConfig(stored ?? defaultStandardsConfig())
    setConfigured(stored !== null)
  }, [])

  useEffect(() => {
    const onChange = () => syncFromStorage()
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [syncFromStorage])

  const saveConfig = useCallback((next: StandardsConfig): StandardsConfigEnvelope => {
    const envelope = writeStandardsConfig(next)
    setConfig(next)
    setConfigured(true)
    emitChanged()
    return envelope
  }, [])

  return {
    config,
    configured,
    saveConfig,
    reload: syncFromStorage,
    moduleName: config.custom_module_name,
  }
}

export function notifyStandardsConfigSaved() {
  emitChanged()
}
