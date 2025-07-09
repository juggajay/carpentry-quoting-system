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
import { toast } from 'sonner';

type SupplierType = 'bunnings' | 'tradelink' | 'reece' | 'custom';

const SUPPLIERS = {
  bunnings: {
    name: 'Bunnings',
    categories: ['Timber', 'Plumbing', 'Hardware', 'Concrete'],
  },
  tradelink: {
    name: 'Tradelink',
    categories: ['Plumbing', 'Bathroom', 'Hot Water'],
  },
  reece: {
    name: 'Reece',
    categories: ['Plumbing', 'Bathroom', 'HVAC-R'],
  },
  custom: {
    name: 'Custom URL',
    categories: [],
  },
};

interface MaterialScraperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScrape: (config: { source: string; category?: string; materials?: string[]; customUrl?: string }) => Promise<void>;
}

export function MaterialScraperDialog({ 
  open, 
  onOpenChange,
  onScrape 
}: MaterialScraperDialogProps) {
  const [source, setSource] = useState<SupplierType>('bunnings');
  const [category, setCategory] = useState<string>('');
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const config = {
        source,
        category: category || undefined,
        ...(source === 'custom' && {
          customUrl,
        }),
      };

      await onScrape(config);
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
            <Select value={source} onValueChange={(v) => setSource(v as SupplierType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPLIERS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection for supported suppliers */}
          {source !== 'custom' && SUPPLIERS[source].categories.length > 0 && (
            <div className="space-y-2">
              <Label>Category (Optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {SUPPLIERS[source].categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom URL Configuration */}
          {source === 'custom' && (
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
                  Custom URL scraping is coming soon. For now, please use one of the supported suppliers.
                </p>
              </div>
            </>
          )}


          {/* Preview of what will be scraped */}
          <div className="flex items-start space-x-2 p-4 bg-blue-900/20 border border-blue-700 rounded-md">
            <Search className="h-4 w-4 text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-300">
              {source !== 'custom' ? (
                <>
                  Will scrape from <strong>{SUPPLIERS[source].name}</strong>
                  {category && ` - ${category} category`}
                  {!category && ' - all categories'}
                </>
              ) : (
                <>
                  Custom URL scraping: <strong>{customUrl || 'Not specified'}</strong>
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
            disabled={loading || (source === 'custom')}
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}