'use client';

import { useState } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialScraperDialog } from './MaterialScraperDialog';
import { ImportPreview } from '@/components/materials/ImportPreview';
import { ImportProgress } from '@/components/materials/ImportProgress';
import { AsyncImportProgress } from '@/components/materials/AsyncImportProgress';
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

interface ScrapedProduct {
  name: string;
  description?: string;
  sku?: string;
  supplier: string;
  unit: string;
  pricePerUnit: number;
  gstInclusive: boolean;
  category?: string;
  inStock: boolean;
  status?: 'new' | 'existing' | 'error';
  error?: string;
}

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

interface MaterialImportButtonProps {
  onImportComplete?: () => void;
}

export function MaterialImportButton({ onImportComplete }: MaterialImportButtonProps = {}) {
  const [scraperOpen, setScraperOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [importProgress, setImportProgress] = useState<ProgressUpdate | null>(null);
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null);
  const router = useRouter();
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleScrape = async (config: { source: string; category?: string; materials?: string[]; customUrl?: string; limit?: number }) => {
    setScraping(true);
    
    try {
      // Show progress toast
      const toastId = toast.loading(`Scraping products from ${config.source}...`);
      
      const response = await fetch('/api/materials/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: config.source.toLowerCase(),
          category: config.category,
          urls: config.customUrl ? [config.customUrl] : undefined,
          customUrl: config.customUrl,
          limit: config.limit,
          options: {
            updateExisting: true,
            importNew: true,
            includeGST: true,
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Found ${data.summary.total} products from ${config.source}`, { id: toastId });
        setScrapedProducts(data.products);
        setScraperOpen(false);
        setPreviewOpen(true);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Scraping failed';
        toast.error(errorMsg, { id: toastId });
        console.error('Scraping error:', data);
      }
    } catch (error) {
      toast.error('Connection error - check console for details');
      console.error('Fetch error:', error);
    } finally {
      setScraping(false);
    }
  };

  const handleImport = async (selectedProducts: ScrapedProduct[]) => {
    setImporting(true);
    
    const CHUNK_SIZE = 100; // Process 100 items at a time
    const isChunkedImport = selectedProducts.length > CHUNK_SIZE;
    
    // Initialize progress
    setImportProgress({
      total: selectedProducts.length,
      processed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(selectedProducts.length / CHUNK_SIZE),
      percentComplete: 0,
    });

    let sessionId: string | undefined;
    const cumulativeResults = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // Create import session for chunked imports
      if (isChunkedImport) {
        const sessionRes = await fetch('/api/materials/import/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalProducts: selectedProducts.length }),
        });
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          sessionId = sessionData.sessionId;
        }
      }

      // Process in chunks
      const chunks = [];
      for (let i = 0; i < selectedProducts.length; i += CHUNK_SIZE) {
        chunks.push(selectedProducts.slice(i, i + CHUNK_SIZE));
      }

      // Start progress polling for session
      if (sessionId) {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const sessionRes = await fetch(`/api/materials/import/session?sessionId=${sessionId}`);
            if (sessionRes.ok) {
              const session = await sessionRes.json();
              setImportProgress({
                total: session.totalProducts,
                processed: session.processedProducts,
                imported: session.imported,
                updated: session.updated,
                skipped: session.skipped,
                errors: session.errors,
                currentBatch: Math.floor(session.processedProducts / CHUNK_SIZE) + 1,
                totalBatches: Math.ceil(session.totalProducts / CHUNK_SIZE),
                percentComplete: Math.round((session.processedProducts / session.totalProducts) * 100),
              });
              
              // Stop polling if complete
              if (session.status === 'completed') {
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
              }
            }
          } catch (error) {
            console.error('Session polling error:', error);
          }
        }, 1000); // Poll every second
      }

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1} of ${chunks.length} (${chunk.length} items)`);
        
        // Update progress before processing chunk
        if (!sessionId) {
          setImportProgress(prev => ({
            ...prev!,
            currentBatch: i + 1,
            currentItem: `Processing batch ${i + 1} of ${chunks.length}...`,
          }));
        }
        
        const response = await fetch('/api/materials/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            products: chunk,
            options: {
              updateExisting: true,
              importNew: true,
            },
            sessionId,
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          // Update cumulative results
          cumulativeResults.imported += data.results.imported;
          cumulativeResults.updated += data.results.updated;
          cumulativeResults.skipped += data.results.skipped;
          cumulativeResults.errors += data.results.errors;
          
          // Update progress for non-session imports
          if (!sessionId) {
            setImportProgress(prev => ({
              ...prev!,
              processed: Math.min((i + 1) * CHUNK_SIZE, selectedProducts.length),
              imported: cumulativeResults.imported,
              updated: cumulativeResults.updated,
              skipped: cumulativeResults.skipped,
              errors: cumulativeResults.errors,
              currentBatch: i + 1,
              percentComplete: Math.round(((i + 1) * CHUNK_SIZE / selectedProducts.length) * 100),
            }));
          }
        } else {
          console.error(`Chunk ${i + 1} failed:`, data);
          toast.error(`Failed to import chunk ${i + 1}: ${data.error || 'Unknown error'}`);
          // Continue with next chunk even if one fails
        }
        
        // Add a small delay between chunks to avoid overwhelming the server
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // All chunks processed
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      toast.success(`Import complete! Imported ${cumulativeResults.imported} new and updated ${cumulativeResults.updated} existing materials`);
      setScrapedProducts([]);
      setPreviewOpen(false);
      setImportProgress(null);
      
      // Refresh the page to show new materials
      router.refresh();
      
      // Call the callback if provided
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed - check console for details');
    } finally {
      setImporting(false);
      // Clean up polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  };

  const handleAsyncImportComplete = () => {
    toast.success('Import completed successfully!');
    setScrapedProducts([]);
    setPreviewOpen(false);
    setAsyncJobId(null);
    // Refresh the page to show new materials
    router.refresh();
  };

  const handleAsyncImportCancel = () => {
    toast.info('Import cancelled');
    setAsyncJobId(null);
    setPreviewOpen(false);
  };

  return (
    <>
      <Button onClick={() => setScraperOpen(true)} variant="outline" disabled={scraping}>
        {scraping ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Scraping...
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 mr-2" />
            Import from Supplier
          </>
        )}
      </Button>

      <MaterialScraperDialog
        open={scraperOpen}
        onOpenChange={setScraperOpen}
        onScrape={handleScrape}
      />

      <Modal open={previewOpen} onOpenChange={setPreviewOpen}>
        <ModalContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <ModalHeader>
            <ModalTitle>Import Materials Preview</ModalTitle>
            <ModalDescription>
              Review and select materials to import
            </ModalDescription>
          </ModalHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {asyncJobId ? (
              <AsyncImportProgress
                jobId={asyncJobId}
                onComplete={handleAsyncImportComplete}
                onCancel={handleAsyncImportCancel}
              />
            ) : importProgress ? (
              <ImportProgress 
                progress={importProgress} 
                isVisible={true}
              />
            ) : (
              <ImportPreview
                products={scrapedProducts}
                onImport={handleImport}
                isImporting={importing}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}