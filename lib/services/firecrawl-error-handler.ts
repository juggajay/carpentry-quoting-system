export class FirecrawlError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FirecrawlError';
  }
}

export interface ErrorLog {
  timestamp: Date;
  supplier: string;
  url?: string;
  error: string;
  code: string;
  details?: any;
}

export class FirecrawlErrorHandler {
  private errors: ErrorLog[] = [];
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  async withRetry<T>(
    operation: () => Promise<T>,
    context: { supplier: string; url?: string }
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Log the error
        this.logError({
          supplier: context.supplier,
          url: context.url,
          error: lastError.message,
          code: this.getErrorCode(lastError),
          details: { attempt, maxRetries: this.maxRetries },
        });

        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === this.maxRetries) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private isRetryableError(error: Error): boolean {
    const retryableCodes = [
      'RATE_LIMIT',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
    ];

    const errorCode = this.getErrorCode(error);
    return retryableCodes.includes(errorCode);
  }

  private getErrorCode(error: Error): string {
    if (error.message.includes('rate limit')) return 'RATE_LIMIT';
    if (error.message.includes('timeout')) return 'TIMEOUT';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('500') || error.message.includes('502') || 
        error.message.includes('503')) return 'SERVER_ERROR';
    if (error.message.includes('401')) return 'AUTH_ERROR';
    if (error.message.includes('404')) return 'NOT_FOUND';
    return 'UNKNOWN_ERROR';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logError(log: Omit<ErrorLog, 'timestamp'>): void {
    this.errors.push({
      ...log,
      timestamp: new Date(),
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  getErrorsBySupplier(supplier: string): ErrorLog[] {
    return this.errors.filter(e => e.supplier === supplier);
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Handle specific Firecrawl API errors
  handleApiError(error: any, context: { supplier: string; url?: string }): never {
    let message = 'Unknown error occurred';
    let code = 'UNKNOWN_ERROR';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          message = 'Invalid Firecrawl API key';
          code = 'AUTH_ERROR';
          break;
        case 402:
          message = 'Firecrawl API quota exceeded';
          code = 'QUOTA_EXCEEDED';
          break;
        case 429:
          message = 'Rate limit exceeded. Please try again later';
          code = 'RATE_LIMIT';
          break;
        case 500:
        case 502:
        case 503:
          message = 'Firecrawl service temporarily unavailable';
          code = 'SERVER_ERROR';
          break;
        default:
          message = data?.message || `API error: ${status}`;
          code = `API_ERROR_${status}`;
      }
    } else if (error.request) {
      message = 'Network error: Unable to reach Firecrawl service';
      code = 'NETWORK_ERROR';
    } else {
      message = error.message || message;
    }

    this.logError({
      supplier: context.supplier,
      url: context.url,
      error: message,
      code,
      details: error,
    });

    throw new FirecrawlError(message, code, error);
  }

  // Create error summary for UI
  getErrorSummary(): {
    total: number;
    byCode: Record<string, number>;
    bySupplier: Record<string, number>;
    recent: ErrorLog[];
  } {
    const byCode: Record<string, number> = {};
    const bySupplier: Record<string, number> = {};

    this.errors.forEach(error => {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      bySupplier[error.supplier] = (bySupplier[error.supplier] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCode,
      bySupplier,
      recent: this.errors.slice(-10),
    };
  }
}

// Singleton instance
export const errorHandler = new FirecrawlErrorHandler();