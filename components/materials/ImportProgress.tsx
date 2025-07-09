'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, Clock, Package } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/services/import-progress';

interface ProgressUpdate {
  total: number;
  processed: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  currentItem?: string;
}

interface ImportProgressProps {
  progress: ProgressUpdate;
  isVisible: boolean;
}

export function ImportProgress({ progress, isVisible }: ImportProgressProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isVisible && progress.percentComplete > 0) {
      setAnimate(true);
    }
  }, [isVisible, progress.percentComplete]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    if (progress.percentComplete === 100) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (progress.errors > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <Package className="h-5 w-5 text-blue-600 animate-pulse" />;
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold">
                {progress.percentComplete === 100 ? 'Import Complete' : 'Importing Materials'}
              </h3>
              {progress.currentItem && progress.percentComplete < 100 && (
                <p className="text-sm text-muted-foreground">
                  Processing: {progress.currentItem}
                </p>
              )}
            </div>
          </div>
          
          {progress.estimatedTimeRemaining && progress.percentComplete < 100 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTimeRemaining(progress.estimatedTimeRemaining)} remaining
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.processed} of {progress.total} items</span>
            <span>{progress.percentComplete}%</span>
          </div>
          <Progress 
            value={progress.percentComplete} 
            className={`h-2 ${animate ? 'transition-all duration-300' : ''}`}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.imported}
            </div>
            <div className="text-xs text-muted-foreground">Imported</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.updated}
            </div>
            <div className="text-xs text-muted-foreground">Updated</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {progress.skipped}
            </div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {progress.errors}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>

        {progress.totalBatches > 1 && (
          <div className="text-sm text-muted-foreground text-center">
            Batch {progress.currentBatch} of {progress.totalBatches}
          </div>
        )}
      </div>
    </Card>
  );
}