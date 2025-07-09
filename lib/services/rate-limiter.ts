interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  public readonly maxRequests: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  /**
   * Check if a request should be rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry) {
      // First request
      this.limits.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      });
      return false;
    }

    // Check if window has expired
    if (now - entry.firstRequest > this.windowMs) {
      // Reset window
      this.limits.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      });
      return false;
    }

    // Increment count
    entry.count++;
    entry.lastRequest = now;

    // Check if limit exceeded
    return entry.count > this.maxRequests;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return this.maxRequests;

    const now = Date.now();
    if (now - entry.firstRequest > this.windowMs) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return 0;

    const now = Date.now();
    const timeElapsed = now - entry.firstRequest;
    const timeRemaining = this.windowMs - timeElapsed;

    return Math.max(0, timeRemaining);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.limits.forEach((entry, key) => {
      if (now - entry.lastRequest > this.windowMs * 2) {
        expired.push(key);
      }
    });

    expired.forEach(key => this.limits.delete(key));
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Different rate limiters for different endpoints
export const rateLimiters = {
  scrape: new RateLimiter(60000, 10), // 10 requests per minute
  import: new RateLimiter(60000, 20), // 20 requests per minute
  api: new RateLimiter(60000, 60), // 60 requests per minute
};

// Middleware helper for Next.js API routes
export async function withRateLimit(
  req: Request,
  limiter: RateLimiter,
  identifier?: string
): Promise<Response | null> {
  // Get identifier from IP or user ID
  const id = identifier || req.headers.get('x-forwarded-for') || 'anonymous';
  
  if (limiter.isRateLimited(id)) {
    const resetTime = limiter.getResetTime(id);
    const resetDate = new Date(Date.now() + resetTime).toISOString();
    
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(resetTime / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limiter.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate,
          'Retry-After': Math.ceil(resetTime / 1000).toString(),
        },
      }
    );
  }

  // Request allowed - return null to continue
  return null;
}