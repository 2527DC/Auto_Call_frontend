'use client'

import { useEffect, useState } from 'react'

// While a form has unsaved changes: the browser asks before a reload or tab
// close, and clicks on in-app links are held so the page can ask first.
// Returns the held link (or null) and a way to clear it.
export function useUnsavedChangesGuard(dirty: boolean) {
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
    // Capture phase on document runs before React's handlers, so Next's <Link>
    // never sees the click.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      setPendingHref(url.pathname + url.search + url.hash)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty])

  return { pendingHref, clearPending: () => setPendingHref(null) }
}
