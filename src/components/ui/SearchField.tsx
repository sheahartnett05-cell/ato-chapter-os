import { Search, X } from 'lucide-react'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  'aria-label'?: string
}

const inputBase =
  'block w-full min-w-[10rem] rounded-md border border-black/15 bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--ink)] shadow-sm placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-subtle)]'

/** Consistent search input — full width on mobile, clear button when filled. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  inputClassName = '',
  'aria-label': ariaLabel = 'Search',
}: SearchFieldProps) {
  return (
    <div className={`relative w-full min-w-0 sm:max-w-md ${className}`}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[var(--muted)]"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${inputBase} ${inputClassName}`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-sm p-1 text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  )
}
