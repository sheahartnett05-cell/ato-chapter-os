import { TopBarChapterModeLinks } from './ChapterModeNav'
import { Logo } from './Logo'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  /** When false, hide compact Logo (sidebar already shows brand). Default true. */
  showBrand?: boolean
}

/**
 * Page title bar. Mobile menu + Room/Officer tabs live in AppShells chrome —
 * this bar is title + actions only (avoids duplicate hamburgers on phone).
 */
export function TopBar({ title, subtitle, actions, showBrand = true }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[color-mix(in_srgb,var(--surface-card)_92%,transparent)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
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
