import * as React from "react"

const MOBILE_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024

function useMediaQuery(query: string, getSnapshot: () => boolean) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(getSnapshot())
    }

    mql.addEventListener("change", onChange)
    setMatches(getSnapshot())
    return () => mql.removeEventListener("change", onChange)
  }, [getSnapshot, query])

  return !!matches
}

export function useIsMobile() {
  return useMediaQuery(
    `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    React.useCallback(() => window.innerWidth < MOBILE_BREAKPOINT, [])
  )
}

export function useIsDesktop() {
  return useMediaQuery(
    `(min-width: ${DESKTOP_BREAKPOINT}px)`,
    React.useCallback(() => window.innerWidth >= DESKTOP_BREAKPOINT, [])
  )
}
