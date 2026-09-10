/**
 * Webhook security utilities to prevent SSRF attacks
 */

/**
 * Validates webhook URL to prevent SSRF attacks
 * @param url - The webhook URL to validate
 * @returns Object with valid flag and optional error message
 */
export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Webhook URL is required' };
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block file:// and other dangerous protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are allowed for webhook URLs'
      };
    }

    // Block localhost and internal IP addresses
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '[::1]',
      '169.254.169.254', // AWS metadata service
      'metadata.google.internal', // GCP metadata service
      '169.254.169.254', // Azure metadata service
    ];

    if (blockedHosts.includes(hostname)) {
      return {
        valid: false,
        error: 'Webhook URLs cannot point to localhost or internal services'
      };
    }

    // Block private IP ranges (RFC 1918)
    const privateIpPatterns = [
      /^10\./,           // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,     // 192.168.0.0/16
      /^127\./,          // 127.0.0.0/8 (localhost)
      /^169\.254\./,     // 169.254.0.0/16 (link-local)
      /^::1$/,           // IPv6 localhost
      /^fc00:/,          // IPv6 private
      /^fe80:/,          // IPv6 link-local
    ];

    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          error: 'Webhook URLs cannot point to private IP addresses'
        };
      }
    }

    // Optional: Allow whitelist of trusted domains
    // For now, allow all public domains (can be restricted further if needed)
    const allowedDomains = process.env.WEBHOOK_ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => {
        return hostname === domain || hostname.endsWith('.' + domain);
      });
      
      if (!isAllowed) {
        return {
          valid: false,
          error: `Webhook URL domain not in allowed list. Allowed domains: ${allowedDomains.join(', ')}`
        };
      }
    }

    // Block URLs with credentials in the URL (security best practice)
    if (parsedUrl.username || parsedUrl.password) {
      return {
        valid: false,
        error: 'Webhook URLs cannot contain credentials. Use authentication headers instead.'
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid webhook URL format'
    };
  }
}

/**
 * Enhanced webhook URL validation with additional security checks
 * @param url - The webhook URL to validate
 * @param options - Additional validation options
 */
export function validateWebhookUrlAdvanced(
  url: string,
  options: {
    requireHttps?: boolean;
    allowedDomains?: string[];
    blockPrivateIPs?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const basicValidation = validateWebhookUrl(url);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  try {
    const parsedUrl = new URL(url);

    // Require HTTPS in production
    if (options.requireHttps && parsedUrl.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Webhook URLs must use HTTPS in production'
      };
    }

    // Check against custom allowed domains
    if (options.allowedDomains && options.allowedDomains.length > 0) {
      const hostname = parsedUrl.hostname.toLowerCase();
      const isAllowed = options.allowedDomains.some(domain => {
        return hostname === domain || hostname.endsWith('.' + domain);
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `Webhook URL domain not in allowed list`
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid webhook URL format'
    };
  }
}

