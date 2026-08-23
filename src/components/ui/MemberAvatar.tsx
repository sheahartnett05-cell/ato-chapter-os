interface MemberAvatarProps {
  photoUrl?: string
  initials: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  accentColor?: string
}

const SIZE_CLASS = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-2xl',
}

export function MemberAvatar({
  photoUrl,
  initials,
  size = 'md',
  className = '',
  accentColor = 'var(--primary)',
}: MemberAvatarProps) {
  const base = `${SIZE_CLASS[size]} shrink-0 overflow-hidden rounded-sm flex items-center justify-center font-serif text-white ${className}`

  if (photoUrl) {
    return <img src={photoUrl} alt="" className={`${base} object-cover`} />
  }

  return (
    <div className={base} style={{ backgroundColor: accentColor }}>
      {initials}
    </div>
  )
}
