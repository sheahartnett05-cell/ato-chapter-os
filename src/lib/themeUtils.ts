/** Relative luminance (0–1) for contrast decisions */
export function hexLuminance(hex: string): number {
  const raw = hex.replace('#', '')
  const n =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const num = parseInt(n, 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function isLightColor(hex: string): boolean {
  return hexLuminance(hex) > 0.55
}

export function contrastText(hex: string): '#ffffff' | '#171717' {
  return isLightColor(hex) ? '#171717' : '#ffffff'
}

export function lightenHex(hex: string, amount: number): string {
  const raw = hex.replace('#', '')
  const n =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const num = parseInt(n, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}

export function darkenHex(hex: string, amount: number): string {
  const raw = hex.replace('#', '')
  const n =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const num = parseInt(n, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const mix = (channel: number) => Math.round(channel * (1 - amount))
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}

/** When accent is white/light, use secondary for interactive elements */
export function effectiveAccent(_primary: string, secondary: string, accent: string): string {
  return isLightColor(accent) ? secondary : accent
}

export function effectiveAccentText(
  primary: string,
  secondary: string,
  accent: string
): string {
  const eff = effectiveAccent(primary, secondary, accent)
  return contrastText(eff)
}
