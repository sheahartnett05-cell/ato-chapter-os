/** Which bottom-tab destination should look active for the current path. */
export function isMobileNavActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to || pathname === `${to}/`

  if (to === '/calendar') {
    return pathname.startsWith('/calendar') || pathname.startsWith('/events/')
  }
  if (to === '/members') {
    return pathname.startsWith('/members')
  }
  if (to === '/attendance') {
    return pathname.startsWith('/attendance') || pathname.startsWith('/excuses')
  }
  if (to === '/committees') {
    return pathname.startsWith('/committees')
  }
  if (to === '/settings') {
    return pathname.startsWith('/settings')
  }
  if (to === '/profile') {
    return pathname.startsWith('/profile')
  }
  if (to === '/home') {
    return pathname === '/home' || pathname === '/home/'
  }
  if (to === '/my-dashboard') {
    return (
      pathname === '/my-dashboard' ||
      pathname === '/my-dashboard/' ||
      pathname === '/chapter-room' ||
      pathname === '/chapter-room/'
    )
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}
