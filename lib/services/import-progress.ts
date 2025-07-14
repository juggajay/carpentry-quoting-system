import { EventEmitter } from 'events';

export interface ProgressUpdate {
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

export class ImportProgressTracker extends EventEmitter {
  private startTime: number = 0;
  private progress: ProgressUpdate = {
    total: 0,
    processed: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    currentBatch: 0,
    totalBatches: 0,
    percentComplete: 0,
  };

  start(total: number, batchSize: number = 50): void {
    try {
      this.startTime = Date.now();
      this.progress = {
        total,
        processed: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(total / batchSize),
        percentComplete: 0,
      };
      this.emit('start', this.progress);
    } catch (e) {
      console.error('Progress start error:', e);
    }
  }

  updateBatch(batchNumber: number): void {
    try {
      this.progress.currentBatch = batchNumber;
      this.calculateProgress();
      this.emit('batch', this.progress);
    } catch (e) {
      console.error('Progress updateBatch error:', e);
    }
  }

  recordImported(count: number = 1, itemName?: string): void {
    try {
      this.progress.imported += count;
      this.progress.processed += count;
      this.progress.currentItem = itemName;
      this.calculateProgress();
      this.emit('imported', this.progress);
    } catch (e) {
      console.error('Progress recordImported error:', e);
    }
  }

  recordUpdated(count: number = 1, itemName?: string): void {
    try {
      this.progress.updated += count;
      this.progress.processed += count;
      this.progress.currentItem = itemName;
      this.calculateProgress();
      this.emit('updated', this.progress);
    } catch (e) {
      console.error('Progress recordUpdated error:', e);
    }
  }

  recordSkipped(count: number = 1, itemName?: string): void {
    try {
      this.progress.skipped += count;
      this.progress.processed += count;
      this.progress.currentItem = itemName;
      this.calculateProgress();
      this.emit('skipped', this.progress);
    } catch (e) {
      console.error('Progress recordSkipped error:', e);
    }
  }

  recordError(count: number = 1, itemName?: string): void {
    try {
      this.progress.errors += count;
      this.progress.processed += count;
      this.progress.currentItem = itemName;
      this.calculateProgress();
      this.emit('error', this.progress);
    } catch (e) {
      console.error('Progress recordError error:', e);
    }
  }

  complete(): void {
    try {
      this.calculateProgress();
      this.emit('complete', {
        ...this.progress,
        duration: Date.now() - this.startTime,
      });
    } catch (e) {
      console.error('Progress complete error:', e);
    }
  }

  getProgress(): ProgressUpdate {
    return { ...this.progress };
  }

  private calculateProgress(): void {
    try {
      if (this.progress.total === 0) return;

      this.progress.percentComplete = Math.round(
        (this.progress.processed / this.progress.total) * 100
      );

      // Estimate time remaining
      const elapsed = Date.now() - this.startTime;
      const itemsPerMs = this.progress.processed / elapsed;
      const remainingItems = this.progress.total - this.progress.processed;
      
      if (itemsPerMs > 0) {
        this.progress.estimatedTimeRemaining = Math.round(
          remainingItems / itemsPerMs
        );
      }

      this.emit('progress', this.progress);
    } catch (e) {
      console.error('Progress calculateProgress error:', e);
    }
  }
}

// Singleton instance
export const importProgress = new ImportProgressTracker();

// Helper to format time remaining
export function formatTimeRemaining(ms: number): string {
  if (ms < 1000) return 'Less than a second';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}