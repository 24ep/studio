export const SIDEBAR_TOGGLE_MIN_INTERVAL = 150
export const SIDEBAR_TOGGLE_RESET_DELAY = 500
export const SIDEBAR_HOVER_COLLAPSE_DELAY = 200

export function clearSidebarTimeout(timeoutRef: { current: NodeJS.Timeout | null }) {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }
}

export function canAttemptSidebarToggle({
  isToggling,
  lastToggleTime,
  now,
}: {
  isToggling: boolean
  lastToggleTime: number
  now: number
}) {
  return !isToggling && now - lastToggleTime >= SIDEBAR_TOGGLE_MIN_INTERVAL
}

export function shouldExpandSidebarOnHover({
  isMobile,
  manuallyExpanded,
  open,
}: {
  isMobile: boolean
  manuallyExpanded: boolean
  open: boolean
}) {
  return !isMobile && !open && !manuallyExpanded
}

export function shouldCollapseSidebarOnLeave({
  isMobile,
  manuallyExpanded,
  open,
}: {
  isMobile: boolean
  manuallyExpanded: boolean
  open: boolean
}) {
  return !isMobile && open && !manuallyExpanded
}

export function shouldBlurCollapsedOffcanvas({
  collapsible,
  state,
}: {
  collapsible: "offcanvas" | "icon" | "none"
  state: "expanded" | "collapsed"
}) {
  return state === "collapsed" && collapsible === "offcanvas"
}

export function shouldReplaceAriaHiddenWithInert(mutation: MutationRecord, target: HTMLElement) {
  return mutation.type === "attributes"
    && mutation.attributeName === "aria-hidden"
    && target.getAttribute("aria-hidden") === "true"
    && target.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])").length > 0
}
