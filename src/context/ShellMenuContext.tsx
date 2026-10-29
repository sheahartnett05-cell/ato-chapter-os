import { createContext, useContext, type ReactNode } from 'react'

type ShellMenuContextValue = {
  openMenu: () => void
}

const ShellMenuContext = createContext<ShellMenuContextValue | null>(null)

export function ShellMenuProvider({
  openMenu,
  children,
}: {
  openMenu: () => void
  children: ReactNode
}) {
  return (
    <ShellMenuContext.Provider value={{ openMenu }}>{children}</ShellMenuContext.Provider>
  )
}

export function useShellMenuOptional(): ShellMenuContextValue | null {
  return useContext(ShellMenuContext)
}
