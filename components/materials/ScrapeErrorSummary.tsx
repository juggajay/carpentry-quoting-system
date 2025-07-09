'use client';

import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ErrorSummary {
  total: number;
  byCode: Record<string, number>;
  bySupplier: Record<string, number>;
  recent: Array<{
    timestamp: Date;
    supplier: string;
    error: string;
    code: string;
  }>;
}

interface ScrapeErrorSummaryProps {
  errorSummary: ErrorSummary;
  onRetry?: () => void;
  onClear?: () => void;
}

export function ScrapeErrorSummary({ 
  errorSummary, 
  onRetry, 
  onClear 
}: ScrapeErrorSummaryProps) {
  if (errorSummary.total === 0) return null;

  const getErrorTypeLabel = (code: string): string => {
    const labels: Record<string, string> = {
      'RATE_LIMIT': 'Rate Limited',
      'NETWORK_ERROR': 'Network Issue',
      'AUTH_ERROR': 'Authentication',
      'TIMEOUT': 'Timeout',
      'SERVER_ERROR': 'Server Error',
      'NOT_FOUND': 'Not Found',
      'QUOTA_EXCEEDED': 'Quota Exceeded',
    };
    return labels[code] || code;
  };

  const getErrorSeverity = (code: string): 'default' | 'error' | 'warning' => {
    if (['AUTH_ERROR', 'QUOTA_EXCEEDED'].includes(code)) return 'error';
    if (['RATE_LIMIT', 'TIMEOUT'].includes(code)) return 'warning';
    return 'default';
  };

  const mostCommonError = Object.entries(errorSummary.byCode)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">Scraping Errors Detected</h3>
          <div className="mt-2 space-y-3">
            <p className="text-sm text-red-700">
              {errorSummary.total} error{errorSummary.total > 1 ? 's' : ''} occurred during scraping.
              {mostCommonError && ` Most common: ${getErrorTypeLabel(mostCommonError[0])}`}
            </p>

            {/* Error breakdown by type */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(errorSummary.byCode).map(([code, count]) => (
                <Badge 
                  key={code} 
                  variant={getErrorSeverity(code)}
                  className="text-xs"
                >
                  {getErrorTypeLabel(code)}: {count}
                </Badge>
              ))}
            </div>

            {/* Recent errors */}
            {errorSummary.recent.length > 0 && (
              <div className="border-t border-red-200 pt-2 mt-2">
                <p className="text-xs font-medium mb-1 text-red-700">Recent errors:</p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {errorSummary.recent.slice(-3).map((error, idx) => (
                    <div key={idx} className="text-xs text-red-600">
                      <span className="font-medium">{error.supplier}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {onRetry && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Failed
                </Button>
              )}
              {onClear && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={onClear}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Errors
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}