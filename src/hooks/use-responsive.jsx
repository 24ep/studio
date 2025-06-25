"use client";
import { useState, useEffect, useCallback } from 'react';
// Breakpoint definitions
export const BREAKPOINTS = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};
export function useResponsive() {
    const [state, setState] = useState({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: false,
        currentBreakpoint: 'xs',
        width: 0,
        height: 0,
        orientation: 'portrait',
    });
    const updateState = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        // Determine current breakpoint
        let currentBreakpoint = 'xs';
        for (const [breakpoint, minWidth] of Object.entries(BREAKPOINTS)) {
            if (width >= minWidth) {
                currentBreakpoint = breakpoint;
            }
        }
        // Determine device type
        const isMobile = width < BREAKPOINTS.md;
        const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
        const isDesktop = width >= BREAKPOINTS.lg && width < BREAKPOINTS['2xl'];
        const isLargeDesktop = width >= BREAKPOINTS['2xl'];
        // Determine orientation
        const orientation = width > height ? 'landscape' : 'portrait';
        setState({
            isMobile,
            isTablet,
            isDesktop,
            isLargeDesktop,
            currentBreakpoint,
            width,
            height,
            orientation,
        });
    }, []);
    useEffect(() => {
        // Set initial state
        updateState();
        // Add event listener
        window.addEventListener('resize', updateState);
        window.addEventListener('orientationchange', updateState);
        return () => {
            window.removeEventListener('resize', updateState);
            window.removeEventListener('orientationchange', updateState);
        };
    }, [updateState]);
    return state;
}
// Hook for checking if screen is above a specific breakpoint
export function useBreakpoint(breakpoint) {
    const { width } = useResponsive();
    return width >= BREAKPOINTS[breakpoint];
}
// Hook for checking if screen is below a specific breakpoint
export function useBreakpointDown(breakpoint) {
    const { width } = useResponsive();
    return width < BREAKPOINTS[breakpoint];
}
// Hook for checking if screen is between two breakpoints
export function useBreakpointBetween(minBreakpoint, maxBreakpoint) {
    const { width } = useResponsive();
    return width >= BREAKPOINTS[minBreakpoint] && width < BREAKPOINTS[maxBreakpoint];
}
// Hook for touch device detection
export function useTouchDevice() {
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    useEffect(() => {
        const checkTouchDevice = () => {
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsTouchDevice(isTouch);
        };
        checkTouchDevice();
    }, []);
    return isTouchDevice;
}
// Hook for reduced motion preference
export function useReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (event) => {
            setPrefersReducedMotion(event.matches);
        };
        setPrefersReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);
    return prefersReducedMotion;
}
// Hook for high contrast mode preference
export function useHighContrast() {
    const [prefersHighContrast, setPrefersHighContrast] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        const handleChange = (event) => {
            setPrefersHighContrast(event.matches);
        };
        setPrefersHighContrast(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);
    return prefersHighContrast;
}
// Hook for dark mode preference
export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event) => {
            setIsDarkMode(event.matches);
        };
        setIsDarkMode(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);
    return isDarkMode;
}
// Hook for online/offline status
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
}
// Hook for viewport visibility
export function useViewportVisibility() {
    const [isVisible, setIsVisible] = useState(true);
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
    return isVisible;
}
// Hook for scroll position
export function useScrollPosition() {
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition({
                x: window.pageXOffset,
                y: window.pageYOffset,
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    return scrollPosition;
}
// Hook for window focus/blur
export function useWindowFocus() {
    const [isFocused, setIsFocused] = useState(true);
    useEffect(() => {
        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);
    return isFocused;
}
// Utility function to get responsive class names
export function getResponsiveClasses(baseClass, responsiveClasses) {
    const classes = [baseClass];
    Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
        if (className) {
            classes.push(`${breakpoint}:${className}`);
        }
    });
    return classes.join(' ');
}
// Utility function to conditionally render based on breakpoint
export function useConditionalRender(mobile, desktop, breakpoint = 'md') {
    const isAboveBreakpoint = useBreakpoint(breakpoint);
    return isAboveBreakpoint ? desktop : mobile;
}
