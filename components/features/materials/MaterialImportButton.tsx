'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialScraperDialog } from './MaterialScraperDialog';
import { ImportPreview } from '@/components/materials/ImportPreview';
import { ImportProgress } from '@/components/materials/ImportProgress';
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

export function MaterialImportButton() {
  const [scraperOpen, setScraperOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [importProgress, setImportProgress] = useState<ProgressUpdate | null>(null);
  const router = useRouter();

  const handleScrape = async (config: { source: string; category?: string; materials?: string[]; customUrl?: string }) => {
    setScraping(true);
    try {
      const response = await fetch('/api/materials/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: config.source.toLowerCase(),
          category: config.category,
          urls: config.customUrl ? [config.customUrl] : undefined,
          options: {
            updateExisting: true,
            importNew: true,
            includeGST: true,
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Found ${data.summary.total} products from ${config.source}`);
        setScrapedProducts(data.products);
        setScraperOpen(false);
        setPreviewOpen(true);
      } else {
        toast.error(data.error || 'Scraping failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setScraping(false);
    }
  };

  const handleImport = async (selectedProducts: ScrapedProduct[]) => {
    setImporting(true);
    setImportProgress({
      total: selectedProducts.length,
      processed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(selectedProducts.length / 50),
      percentComplete: 0,
    });

    try {
      const response = await fetch('/api/materials/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products: selectedProducts,
          options: {
            updateExisting: true,
            importNew: true,
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Successfully imported ${data.results.imported} new and updated ${data.results.updated} existing materials`);
        setScrapedProducts([]);
        setPreviewOpen(false);
        setImportProgress(null);
        // Refresh the page to show new materials
        router.refresh();
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setImporting(false);
    }
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
        <ModalContent className="max-w-6xl">
          <ModalHeader>
            <ModalTitle>Import Materials Preview</ModalTitle>
            <ModalDescription>
              Review and select materials to import
            </ModalDescription>
          </ModalHeader>
          {importProgress ? (
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
        </ModalContent>
      </Modal>
    </>
  );
}