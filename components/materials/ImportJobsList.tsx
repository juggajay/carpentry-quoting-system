'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, RefreshCw } from 'lucide-react';
import { AsyncImportProgress } from './AsyncImportProgress';
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal';

interface ImportJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  type: string;
  source: string;
  totalItems: number;
  processedItems: number;
  importedItems: number;
  updatedItems: number;
  errorItems: number;
  percentComplete: number;
  createdAt: string;
  completedAt?: string;
}

export function ImportJobsList() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/materials/import/jobs?limit=5');
      const data = await response.json();
      
      if (response.ok && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Failed to load import jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
    
    // Auto-refresh if there are active jobs
    const interval = setInterval(() => {
      const hasActiveJobs = jobs.some(job => 
        ['PENDING', 'PROCESSING'].includes(job.status)
      );
      
      if (hasActiveJobs) {
        loadJobs();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [jobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const getStatusColor = (status: string): "default" | "info" | "primary" | "success" | "warning" | "error" => {
    switch (status) {
      case 'PENDING': return 'default';
      case 'PROCESSING': return 'info';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return null;
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Import Jobs</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium capitalize">{job.source}</span>
                    <Badge variant={getStatusColor(job.status)} size="sm">
                      {job.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {job.status === 'PROCESSING' ? (
                      <span>{job.processedItems} / {job.totalItems} items ({job.percentComplete}%)</span>
                    ) : (
                      <span>
                        {job.totalItems} items • 
                        {job.importedItems > 0 && ` ${job.importedItems} imported`}
                        {job.updatedItems > 0 && ` ${job.updatedItems} updated`}
                        {job.errorItems > 0 && ` ${job.errorItems} errors`}
                      </span>
                    )}
                  </div>
                </div>
                {['PENDING', 'PROCESSING'].includes(job.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>Import Progress</ModalTitle>
          </ModalHeader>
          {selectedJobId && (
            <AsyncImportProgress
              jobId={selectedJobId}
              onComplete={() => {
                setSelectedJobId(null);
                loadJobs();
              }}
              onCancel={() => {
                setSelectedJobId(null);
                loadJobs();
              }}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
}