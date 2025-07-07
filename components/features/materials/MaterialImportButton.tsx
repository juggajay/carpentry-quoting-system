'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialScraperDialog } from './MaterialScraperDialog';
import { useRouter } from 'next/navigation';

export function MaterialImportButton() {
  const [scraperOpen, setScraperOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrapedData, setScrapedData] = useState<Array<{ material: string; price: number; unit: string; supplier: string; lastUpdated: string; inStock: boolean; sourceUrl?: string }>>([]);
  const router = useRouter();

  const handleScrape = async (config: { source: string; materials?: string[]; customUrl?: string; customSelectors?: Record<string, string> }) => {
    setImporting(true);
    try {
      const response = await fetch('/api/materials/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Scraped ${data.count} materials from ${config.source}`);
        setScrapedData(data.materials);
      } else {
        toast.error(data.error || 'Scraping failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (scrapedData.length === 0) {
      toast.error('No scraped data to import. Please scrape first.');
      return;
    }

    setImporting(true);
    try {
      const response = await fetch('/api/materials/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          materials: scrapedData // Already has string dates
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Imported ${data.imported} materials`);
        setScrapedData([]);
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
      <div className="flex gap-2">
        <Button onClick={() => setScraperOpen(true)} variant="outline">
          <Globe className="h-4 w-4 mr-2" />
          Configure Scraper
        </Button>
        
        {scrapedData.length > 0 && (
          <Button onClick={handleImport} variant="outline" disabled={importing}>
            <Download className="h-4 w-4 mr-2" />
            Import {scrapedData.length} Materials
          </Button>
        )}
      </div>

      <MaterialScraperDialog
        open={scraperOpen}
        onOpenChange={setScraperOpen}
        onScrape={handleScrape}
      />
    </>
  );
}