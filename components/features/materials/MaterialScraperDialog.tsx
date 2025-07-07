'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Globe, Search, AlertCircle } from 'lucide-react';
import { SCRAPER_SOURCES, ScraperSource } from '@/lib/material-prices/scraper-config';
import { toast } from 'sonner';

interface MaterialScraperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScrape: (config: { source: string; materials?: string[]; customUrl?: string; customSelectors?: Record<string, string> }) => Promise<void>;
}

export function MaterialScraperDialog({ 
  open, 
  onOpenChange,
  onScrape 
}: MaterialScraperDialogProps) {
  const [source, setSource] = useState<ScraperSource>('bunnings');
  const [customUrl, setCustomUrl] = useState('');
  const [materials, setMaterials] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom selector fields
  const [customSelectors, setCustomSelectors] = useState({
    productList: '',
    price: '',
    title: '',
    unit: '',
  });

  const handleScrape = async () => {
    setLoading(true);
    try {
      const config = {
        source,
        ...(source === 'customUrl' && {
          customUrl,
          customSelectors,
        }),
        materials: materials.split('\n').filter(m => m.trim()),
      };

      await onScrape(config);
      toast.success('Scraping completed');
      onOpenChange(false);
    } catch {
      toast.error('Scraping failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configure Web Scraping
          </ModalTitle>
          <ModalDescription>
            Choose a supplier website to scrape material prices from
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Source Selection */}
          <div className="space-y-2">
            <Label>Supplier Website</Label>
            <Select value={source} onValueChange={(v) => setSource(v as ScraperSource)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCRAPER_SOURCES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom URL Configuration */}
          {source === 'customUrl' && (
            <>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div className="flex items-start space-x-2 p-4 bg-amber-900/20 border border-amber-700 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-300">
                  Custom scraping requires CSS selectors for the website&apos;s HTML structure.
                  This is an advanced feature.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product List Selector</Label>
                  <Input
                    placeholder=".product-item"
                    value={customSelectors.productList}
                    onChange={(e) => setCustomSelectors(prev => ({
                      ...prev,
                      productList: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Selector</Label>
                  <Input
                    placeholder=".price"
                    value={customSelectors.price}
                    onChange={(e) => setCustomSelectors(prev => ({
                      ...prev,
                      price: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title Selector</Label>
                  <Input
                    placeholder=".product-name"
                    value={customSelectors.title}
                    onChange={(e) => setCustomSelectors(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Selector</Label>
                  <Input
                    placeholder=".price-unit"
                    value={customSelectors.unit}
                    onChange={(e) => setCustomSelectors(prev => ({
                      ...prev,
                      unit: e.target.value
                    }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Materials to Search */}
          <div className="space-y-2">
            <Label>Materials to Search (one per line)</Label>
            <textarea
              className="flex min-h-[120px] w-full rounded-lg border border-gray-700 bg-dark-surface px-4 py-3 text-sm text-white ring-offset-dark-surface placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-royal-blue focus-visible:border-royal-blue disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-600 transition-all duration-200"
              placeholder="90x45 Pine 2.4m
12mm Plywood
Liquid Nails 320g"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to scrape all materials from the selected category
            </p>
          </div>

          {/* Preview of what will be scraped */}
          <div className="flex items-start space-x-2 p-4 bg-blue-900/20 border border-blue-700 rounded-md">
            <Search className="h-4 w-4 text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-300">
              {source !== 'customUrl' ? (
                <>
                  Will scrape from <strong>{SCRAPER_SOURCES[source].name}</strong>
                  {materials && ` for ${materials.split('\n').filter(m => m.trim()).length} materials`}
                </>
              ) : (
                <>
                  Will scrape from custom URL: <strong>{customUrl || 'Not specified'}</strong>
                </>
              )}
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleScrape} 
            disabled={loading || (source === 'customUrl' && !customUrl)}
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}