import { Menu } from 'lucide-react'
import { TopBarChapterModeLinks } from './ChapterModeNav'
import { Logo } from './Logo'
import { useShellMenuOptional } from '../../context/ShellMenuContext'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** When false, hide compact Logo (sidebar already shows brand). Default true. */
  showBrand?: boolean
}

export function TopBar({ title, subtitle, actions, showBrand = true }: TopBarProps) {
  const shellMenu = useShellMenuOptional()

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[var(--surface-card)]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          {shellMenu && (
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--rule)] text-[var(--ink)] md:hidden"
              aria-label="Open menu"
              onClick={shellMenu.openMenu}
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
          )}
          <TopBarChapterModeLinks />
          {showBrand && (
            <div className="hidden sm:block">
              <Logo compact onDark={false} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl leading-tight tracking-tight text-[var(--ink)]">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
