"use client"

import * as React from "react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function getSidebarCookie() {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${SIDEBAR_COOKIE_NAME}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null
  return null
}

function getInitialSidebarOpen(defaultOpen: boolean) {
  if (typeof document === "undefined") return defaultOpen

  const cookieValue = getSidebarCookie()
  if (cookieValue === "true") return true
  if (cookieValue === "false") return false
  return defaultOpen
}

function persistSidebarOpen(open: boolean) {
  if (typeof document === "undefined") return

  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`
}

function getInitialManuallyExpanded(defaultOpen: boolean) {
  if (typeof document === "undefined") return false

  const cookieValue = getSidebarCookie()
  return cookieValue === "true" || getInitialSidebarOpen(defaultOpen)
}

interface UseSidebarStateInput {
  defaultOpen: boolean
  openProp?: boolean
  onOpenChange?: (open: boolean) => void
}

export function useSidebarState({
  defaultOpen,
  openProp,
  onOpenChange,
}: UseSidebarStateInput) {
  const [_open, _setOpen] = React.useState(() => getInitialSidebarOpen(defaultOpen))
  const open = openProp ?? _open
  const openRef = React.useRef(open)
  const [manuallyExpanded, setManuallyExpanded] = React.useState(() => getInitialManuallyExpanded(defaultOpen))

  React.useEffect(() => {
    openRef.current = open
  }, [open])

  React.useEffect(() => {
    if (typeof document === "undefined" || openProp !== undefined) return

    const cookieValue = getSidebarCookie()
    if (cookieValue === "true" && !_open) {
      _setOpen(true)
      setManuallyExpanded(true)
    } else if (cookieValue === "false" && _open) {
      _setOpen(false)
      setManuallyExpanded(false)
    }
  }, [openProp, _open])

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean), isManual = false) => {
      const openState = typeof value === "function" ? value(openRef.current) : value

      if (isManual) {
        setManuallyExpanded(openState)
      }

      if (onOpenChange) {
        onOpenChange(openState)
      } else {
        _setOpen(openState)
      }

      persistSidebarOpen(openState)
    },
    [onOpenChange]
  )

  return {
    manuallyExpanded,
    open,
    openRef,
    setManuallyExpanded,
    setOpen,
  }
}
