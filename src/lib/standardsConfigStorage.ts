import { STORAGE_KEYS } from './demoSeed'
import { writeJson } from './persist'
import {
  defaultStandardsConfig,
  type StandardsConfig,
  type StandardsConfigEnvelope,
} from '../types/standardsConfig'

const KEY = STORAGE_KEYS.standardsConfig

export function readStandardsConfig(): StandardsConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StandardsConfigEnvelope | StandardsConfig
    if ('standards_config' in parsed && parsed.standards_config) {
      return { ...defaultStandardsConfig(), ...parsed.standards_config }
    }
    if ('custom_module_name' in parsed) {
      return { ...defaultStandardsConfig(), ...(parsed as StandardsConfig) }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function writeStandardsConfig(config: StandardsConfig): StandardsConfigEnvelope {
  const envelope: StandardsConfigEnvelope = { standards_config: config }
  writeJson(KEY, envelope)
  return envelope
}

export function standardsConfigEnvelope(config: StandardsConfig): StandardsConfigEnvelope {
  return { standards_config: config }
}
