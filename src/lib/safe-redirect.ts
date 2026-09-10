/**
 * Safe redirect utility to prevent Open Redirect vulnerabilities.
 * 
 * SECURITY: This function validates redirect URLs before performing the redirect
 * to ensure only safe, same-origin relative paths are allowed.
 */

/**
 * Validates and sanitizes a redirect URL to prevent open redirect attacks.
 * Only allows relative URLs starting with a single forward slash.
 * 
 * @param url - The URL to validate
 * @param fallback - Fallback URL if the provided URL is invalid (default: '/')
 * @returns A safe URL that can be used for redirection
 */
export function getSafeRedirectUrl(url: string | null | undefined, fallback: string = '/'): string {
    // If no URL provided, return fallback
    if (!url || typeof url !== 'string') {
        return fallback;
    }

    const trimmedUrl = url.trim();

    // Only allow relative URLs starting with / (not // or absolute URLs)
    // This prevents protocol-relative URLs (//evil.com) and absolute URLs (https://evil.com)
    if (!trimmedUrl.startsWith('/') || trimmedUrl.startsWith('//')) {
        return fallback;
    }

    // Block javascript: and data: pseudo-protocols that might be URL-encoded
    const decodedUrl = decodeURIComponent(trimmedUrl).toLowerCase();
    if (decodedUrl.includes('javascript:') || decodedUrl.includes('data:')) {
        return fallback;
    }

    // Prevent redirect loops to the signin page
    if (trimmedUrl === '/auth/signin' || trimmedUrl.startsWith('/auth/signin?')) {
        return fallback;
    }

    return trimmedUrl;
}

/**
 * Performs a safe redirect using window.location.replace.
 * The URL is validated before redirection to prevent open redirect attacks.
 * 
 * @param url - The URL to redirect to (will be validated)
 * @param fallback - Fallback URL if the provided URL is invalid (default: '/')
 */
export function safeRedirect(url: string | null | undefined, fallback: string = '/'): void {
    const safeUrl = getSafeRedirectUrl(url, fallback);

    try {
        // Use replace to avoid adding to browser history (prevents back button issues)
        window.location.replace(safeUrl);
    } catch (error) {
        console.error('[SAFE_REDIRECT] Redirect error:', error);
        // Fallback to href assignment
        window.location.href = fallback;
    }
}

/**
 * Safely opens a URL in a new window/tab with proper validation.
 * Prevents open redirect by validating the URL before opening.
 * 
 * @param url - The URL to open (will be validated)
 * @param target - Target window name (default: '_blank')
 * @returns The window object if successful, null otherwise
 */
export function safeWindowOpen(url: string | null | undefined, target: string = '_blank'): Window | null {
    // If no URL provided, return null
    if (!url || typeof url !== 'string') {
        console.warn('[SAFE_WINDOW_OPEN] No URL provided');
        return null;
    }

    const trimmedUrl = url.trim();

    // Only allow:
    // 1. Relative URLs starting with / (not //)
    // 2. Same-origin absolute URLs (matching current hostname)
    // 3. Safe protocols (http:, https:)

    // Check for dangerous protocols
    const lowerUrl = trimmedUrl.toLowerCase();
    if (lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('vbscript:') ||
        lowerUrl.startsWith('data:')) {
        console.warn('[SAFE_WINDOW_OPEN] Blocked dangerous protocol:', trimmedUrl);
        return null;
    }

    // Allow relative URLs starting with single /
    if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) {
        try {
            return window.open(trimmedUrl, target);
        } catch (error) {
            console.error('[SAFE_WINDOW_OPEN] Error opening window:', error);
            return null;
        }
    }

    // For absolute URLs, verify they match the current origin
    try {
        const currentOrigin = window.location.origin;
        const targetUrl = new URL(trimmedUrl, currentOrigin);

        // Only allow same-origin URLs
        if (targetUrl.origin === currentOrigin) {
            return window.open(trimmedUrl, target);
        } else {
            console.warn('[SAFE_WINDOW_OPEN] Blocked cross-origin URL:', trimmedUrl);
            return null;
        }
    } catch (error) {
        console.warn('[SAFE_WINDOW_OPEN] Invalid URL:', trimmedUrl);
        return null;
    }
}
