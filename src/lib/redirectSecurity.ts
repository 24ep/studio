/**
 * Redirect security utilities to prevent open redirect attacks
 */

/**
 * Validates redirect URLs to prevent open redirect vulnerabilities
 * Only allows relative URLs or URLs from the same origin
 * @param url - The redirect URL to validate
 * @param baseUrl - The base URL of the application (from NEXTAUTH_URL)
 * @returns Object with valid flag and sanitized URL
 */
export function validateRedirectUrl(url: string | null | undefined, baseUrl?: string): { 
  valid: boolean; 
  url?: string; 
  error?: string 
} {
  if (!url) {
    return { valid: true, url: '/' }; // Default to home
  }

  // Remove any leading/trailing whitespace
  url = url.trim();

  // Allow relative URLs (starting with /)
  if (url.startsWith('/')) {
    // Validate relative URL doesn't contain protocol (prevent //evil.com)
    if (url.startsWith('//')) {
      return {
        valid: false,
        error: 'Invalid redirect URL: protocol-relative URLs are not allowed'
      };
    }
    
    // Validate relative URL doesn't contain dangerous patterns
    if (url.includes('://') || url.includes('javascript:') || url.includes('data:')) {
      return {
        valid: false,
        error: 'Invalid redirect URL: contains dangerous patterns'
      };
    }
    
    return { valid: true, url };
  }

  // If baseUrl is provided, validate absolute URLs
  if (baseUrl) {
    try {
      const base = new URL(baseUrl);
      const redirect = new URL(url, baseUrl);
      
      // Only allow same origin
      if (redirect.origin !== base.origin) {
        return {
          valid: false,
          error: 'Invalid redirect URL: must be from the same origin'
        };
      }
      
      // Return the pathname and search params (relative URL)
      return { valid: true, url: redirect.pathname + redirect.search };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid redirect URL format'
      };
    }
  }

  // If no baseUrl, only allow relative URLs
  return {
    valid: false,
    error: 'Invalid redirect URL: only relative URLs are allowed'
  };
}

/**
 * Sanitizes a redirect URL for safe use
 * @param url - The redirect URL to sanitize
 * @param defaultUrl - Default URL to use if validation fails
 * @returns Sanitized URL
 */
export function sanitizeRedirectUrl(url: string | null | undefined, defaultUrl: string = '/'): string {
  const validation = validateRedirectUrl(url, process.env.NEXTAUTH_URL);
  return validation.valid && validation.url ? validation.url : defaultUrl;
}

