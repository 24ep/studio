import * as React from "react"

export type DevicePlatform = 'android' | 'ios' | 'desktop' | 'unknown'

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

export interface DevicePlatformInput {
  userAgent: string
  referrer?: string
  standalone?: boolean
}

function isNavigatorStandalone(nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined) {
  return (nav as StandaloneNavigator | undefined)?.standalone === true
}

export function detectDevicePlatform({
  userAgent,
  referrer = '',
  standalone = false,
}: DevicePlatformInput): DevicePlatform {
  const normalizedUserAgent = userAgent.toLowerCase()

  const isIOS = /iphone|ipad|ipod/.test(normalizedUserAgent) || standalone
  const isAndroidDevice = /android/.test(normalizedUserAgent) || referrer.includes('android-app://')
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(normalizedUserAgent)

  if (isIOS) {
    return 'ios'
  }
  if (isAndroidDevice) {
    return 'android'
  }
  if (!isMobile) {
    return 'desktop'
  }

  return 'unknown'
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  return (
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    isNavigatorStandalone() ||
    document.referrer.includes('android-app://')
  )
}

export function useDevicePlatform() {
  const [platform, setPlatform] = React.useState<DevicePlatform>('unknown')

  React.useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    setPlatform(detectDevicePlatform({
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      standalone: isNavigatorStandalone(),
    }))
  }, [])

  return platform
}

/**
 * Utility function to detect if the device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }
  
  return detectDevicePlatform({
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    standalone: isNavigatorStandalone(),
  }) === 'android'
}

/**
 * Utility function to detect if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }
  
  return detectDevicePlatform({
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    standalone: isNavigatorStandalone(),
  }) === 'ios'
}

/**
 * Utility function to detect if the device is mobile (Android or iOS)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }
  
  return isAndroid() || isIOS()
}

