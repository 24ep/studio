"use client"

import * as React from "react"
import {
  canAttemptSidebarToggle,
  clearSidebarTimeout,
  SIDEBAR_HOVER_COLLAPSE_DELAY,
  SIDEBAR_TOGGLE_RESET_DELAY,
  shouldBlurCollapsedOffcanvas,
  shouldCollapseSidebarOnLeave,
  shouldExpandSidebarOnHover,
  shouldReplaceAriaHiddenWithInert,
} from "./sidebar-interaction-utils"

type SetSidebarOpen = (value: boolean | ((value: boolean) => boolean), isManual?: boolean) => void

export function usePreventAriaHidden(ref: React.RefObject<HTMLElement>, isCollapsed: boolean) {
  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target as HTMLElement
        if (shouldReplaceAriaHiddenWithInert(mutation, target)) {
          target.removeAttribute("aria-hidden")
          target.setAttribute("inert", "")
        }
      })
    })

    observer.observe(element, { attributes: true, subtree: true })

    return () => observer.disconnect()
  }, [ref, isCollapsed])
}

export function useSidebarToggleGuard() {
  const [isToggling, setIsToggling] = React.useState(false)
  const toggleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastToggleTimeRef = React.useRef<number>(0)

  const attemptToggle = React.useCallback((toggleAction: () => void) => {
    const now = Date.now()

    if (!canAttemptSidebarToggle({
      isToggling,
      lastToggleTime: lastToggleTimeRef.current,
      now,
    })) {
      return
    }

    lastToggleTimeRef.current = now
    setIsToggling(true)

    clearSidebarTimeout(toggleTimeoutRef)

    toggleTimeoutRef.current = setTimeout(() => {
      setIsToggling(false)
    }, SIDEBAR_TOGGLE_RESET_DELAY)

    toggleAction()
  }, [isToggling])

  React.useEffect(() => {
    return () => {
      clearSidebarTimeout(toggleTimeoutRef)
    }
  }, [])

  return { attemptToggle, isToggling }
}

export function useSidebarHoverBehavior({
  collapsible,
  isMobile,
  manuallyExpanded,
  open,
  setOpen,
  state,
}: {
  collapsible: "offcanvas" | "icon" | "none"
  isMobile: boolean
  manuallyExpanded: boolean
  open: boolean
  setOpen: SetSidebarOpen
  state: "expanded" | "collapsed"
}) {
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  usePreventAriaHidden(sidebarRef, state === "collapsed")

  const handleMouseEnter = React.useCallback(() => {
    if (isMobile) return
    clearSidebarTimeout(hoverTimeoutRef)

    if (shouldExpandSidebarOnHover({ isMobile, manuallyExpanded, open })) {
      setOpen(true, false)
    }
  }, [isMobile, manuallyExpanded, open, setOpen])

  const handleMouseLeave = React.useCallback(() => {
    if (isMobile) return
    clearSidebarTimeout(hoverTimeoutRef)

    if (shouldCollapseSidebarOnLeave({ isMobile, manuallyExpanded, open })) {
      hoverTimeoutRef.current = setTimeout(() => {
        setOpen(false, false)
      }, SIDEBAR_HOVER_COLLAPSE_DELAY)
    }
  }, [isMobile, manuallyExpanded, open, setOpen])

  React.useEffect(() => {
    return () => {
      clearSidebarTimeout(hoverTimeoutRef)
    }
  }, [])

  React.useEffect(() => {
    if (sidebarRef.current && shouldBlurCollapsedOffcanvas({ collapsible, state })) {
      const focusedElement = sidebarRef.current.querySelector(":focus")
      if (focusedElement instanceof HTMLElement) {
        focusedElement.blur()
      }
    }
  }, [collapsible, state])

  return {
    handleMouseEnter,
    handleMouseLeave,
    sidebarRef,
  }
}
