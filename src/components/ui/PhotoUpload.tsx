import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

const MAX_BYTES = 2 * 1024 * 1024

interface PhotoUploadProps {
  value?: string
  initials: string
  onChange: (dataUrl: string | undefined) => void
  size?: 'sm' | 'md' | 'lg'
  accentColor?: string
}

const SIZES = {
  sm: 'h-12 w-12 text-sm',
  md: 'h-16 w-16 text-lg',
  lg: 'h-24 w-24 text-2xl',
}

export function PhotoUpload({
  value,
  initials,
  onChange,
  size = 'md',
  accentColor = 'var(--primary)',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sizeError, setSizeError] = useState('')

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setSizeError('')
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_BYTES) {
      setSizeError('Photo must be under 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative overflow-hidden rounded-sm ${SIZES[size]} flex items-center justify-center font-serif text-white ring-2 ring-[var(--rule)] transition hover:ring-[var(--accent)]`}
        style={value ? undefined : { backgroundColor: accentColor }}
        title="Upload photo"
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-0.5">
          <Camera size={12} className="text-white" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="mt-1 block w-full font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] hover:text-red-600"
        >
          Remove
        </button>
      )}
      {sizeError && <p className="mt-1 max-w-[12rem] text-xs text-red-600">{sizeError}</p>}
    </div>
  )
}
