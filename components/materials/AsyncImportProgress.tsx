'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/services/import-progress';

interface ImportJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalItems: number;
  processedItems: number;
  importedItems: number;
  updatedItems: number;
  skippedItems: number;
  errorItems: number;
  currentBatch: number;
  totalBatches: number;
  percentComplete: number;
  startedAt?: string;
  completedAt?: string;
  errors?: any;
}

interface AsyncImportProgressProps {
  jobId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function AsyncImportProgress({ jobId, onComplete, onCancel }: AsyncImportProgressProps) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !polling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/materials/import/jobs/${jobId}`);
        const data = await response.json();

        if (response.ok && data.job) {
          setJob(data.job);
          
          // Stop polling if job is complete
          if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.job.status)) {
            setPolling(false);
            if (data.job.status === 'COMPLETED' && onComplete) {
              onComplete();
            }
          }
        } else {
          setError(data.error || 'Failed to fetch job status');
          setPolling(false);
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
        setError('Connection error');
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [jobId, polling, onComplete]);

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/materials/import/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPolling(false);
        if (onCancel) onCancel();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel job');
      }
    } catch (err) {
      console.error('Failed to cancel job:', err);
      setError('Failed to cancel import');
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading import status...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'default';
      case 'PROCESSING': return 'info';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'destructive';
      case 'CANCELLED': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'FAILED': return <AlertCircle className="h-4 w-4" />;
      case 'PROCESSING': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return null;
    }
  };

  const estimatedTimeRemaining = job.startedAt && job.status === 'PROCESSING' ? 
    calculateTimeRemaining(job) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Import Progress</h3>
          <Badge variant={getStatusColor(job.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(job.status)}
              {job.status}
            </span>
          </Badge>
        </div>
        {job.status === 'PROCESSING' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="font-medium">{job.percentComplete}%</span>
          </div>
          <Progress value={job.percentComplete} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{job.processedItems} of {job.totalItems} items</span>
            {estimatedTimeRemaining && (
              <span>~{estimatedTimeRemaining} remaining</span>
            )}
          </div>
        </div>

        {job.status === 'PROCESSING' && (
          <div className="text-sm text-muted-foreground">
            Processing batch {job.currentBatch} of {job.totalBatches}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {job.importedItems}
            </div>
            <div className="text-xs text-muted-foreground">Imported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {job.updatedItems}
            </div>
            <div className="text-xs text-muted-foreground">Updated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {job.skippedItems}
            </div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {job.errorItems}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>

        {job.errors && job.errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Import Errors
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {(Array.isArray(job.errors) ? job.errors : [job.errors]).map((error, idx) => (
                <div key={idx} className="text-xs text-red-700 dark:text-red-300">
                  {typeof error === 'object' ? JSON.stringify(error) : error}
                </div>
              ))}
            </div>
          </div>
        )}

        {job.status === 'COMPLETED' && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Import completed successfully!</span>
            </div>
            {job.completedAt && job.startedAt && (
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Total time: {formatDuration(
                  new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function calculateTimeRemaining(job: ImportJob): string | null {
  if (!job.startedAt || job.processedItems === 0) return null;
  
  const startTime = new Date(job.startedAt).getTime();
  const now = Date.now();
  const elapsed = now - startTime;
  const itemsPerMs = job.processedItems / elapsed;
  const remainingItems = job.totalItems - job.processedItems;
  
  if (itemsPerMs > 0) {
    const remainingMs = remainingItems / itemsPerMs;
    return formatTimeRemaining(remainingMs);
  }
  
  return null;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}