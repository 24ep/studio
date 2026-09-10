export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class WebhookRateLimiter {
  private config: RateLimitConfig;
  private static buckets = new Map<string, number[]>();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(identifier: string): string {
    return `${this.config.keyPrefix}:${identifier}`;
  }

  private pruneRequests(key: string, now = Date.now()): number[] {
    const windowStart = now - this.config.windowMs;
    const requests = WebhookRateLimiter.buckets.get(key) || [];
    const activeRequests = requests.filter((timestamp) => timestamp > windowStart);

    if (activeRequests.length > 0) {
      WebhookRateLimiter.buckets.set(key, activeRequests);
    } else {
      WebhookRateLimiter.buckets.delete(key);
    }

    return activeRequests;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const now = Date.now();

    try {
      const requests = this.pruneRequests(key, now);
      const currentCount = requests.length;
      const allowed = currentCount < this.config.maxRequests;
      
      if (allowed) {
        requests.push(now);
        WebhookRateLimiter.buckets.set(key, requests);
      }

      const resetTime = (requests[0] || now) + this.config.windowMs;
      const remaining = Math.max(0, this.config.maxRequests - requests.length);
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // On Redis error, allow the request
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }
  }

  async getLimitInfo(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const now = Date.now();

    try {
      const requests = this.pruneRequests(key, now);
      const currentCount = requests.length;
      const remaining = Math.max(0, this.config.maxRequests - currentCount);
      const allowed = currentCount < this.config.maxRequests;
      const resetTime = (requests[0] || now) + this.config.windowMs;

      return {
        allowed,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limit info check failed:', error);
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    try {
      WebhookRateLimiter.buckets.delete(key);
    } catch (error) {
      console.error('Rate limit reset failed:', error);
    }
  }
}

// Default rate limit configurations
export const webhookRateLimits = {
  // Per webhook rate limiting
  perWebhook: new WebhookRateLimiter({
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
    keyPrefix: 'webhook:rate:per_webhook'
  }),

  // Global rate limiting
  global: new WebhookRateLimiter({
    maxRequests: 1000, // 1000 requests
    windowMs: 60 * 1000, // per minute
    keyPrefix: 'webhook:rate:global'
  }),

  // Burst protection
  burst: new WebhookRateLimiter({
    maxRequests: 10, // 10 requests
    windowMs: 10 * 1000, // per 10 seconds
    keyPrefix: 'webhook:rate:burst'
  })
};

// Rate limit headers for HTTP responses
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  limit: number
): void {
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
} 
