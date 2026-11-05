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
    <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[color-mix(in_srgb,var(--surface-card)_92%,transparent)] backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {shellMenu && (
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--rule)] text-[var(--ink)] active:bg-black/[0.03] md:hidden"
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
            <h1 className="truncate font-serif text-xl leading-tight tracking-tight text-[var(--ink)] sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[11px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="-mx-1 flex w-[calc(100%+0.5rem)] gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:w-auto lg:shrink-0 lg:justify-end lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
