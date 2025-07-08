'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { searchLabourRates } from '@/app/(protected)/import/labor-rates/carpentry-rates-actions';
import { useDebounce } from '@/hooks/use-debounce';

interface LaborRate {
  rate_id: number;
  category_name: string;
  activity: string;
  description: string | null;
  unit: string;
  rate: number;
  min_rate: number;
  max_rate: number;
}

interface LaborRateSelectorProps {
  onSelect: (rate: LaborRate) => void;
  onAddNew?: () => void;
}

export function LaborRateSelector({ onSelect, onAddNew }: LaborRateSelectorProps) {
  const [search, setSearch] = useState('');
  const [rates, setRates] = useState<LaborRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for rates when search term changes
  useEffect(() => {
    const searchRates = async () => {
      if (!debouncedSearch) {
        setRates([]);
        return;
      }

      setIsLoading(true);
      try {
        const result = await searchLabourRates(debouncedSearch);
        if (result.success) {
          setRates(result.data);
        }
      } catch (error) {
        console.error('Error searching rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchRates();
  }, [debouncedSearch]);

  const handleSelect = (rate: LaborRate) => {
    onSelect(rate);
    setSearch('');
    setIsOpen(false);
    setRates([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search labor activities..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
        />
      </div>

      {isOpen && (search || rates.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : rates.length > 0 ? (
            <div className="py-1">
              {rates.map((rate) => (
                <button
                  key={rate.rate_id}
                  onClick={() => handleSelect(rate)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{rate.activity}</div>
                      <div className="text-xs text-muted-foreground">
                        {rate.category_name} • {rate.description || 'No description'}
                      </div>
                    </div>
                    <div className="text-sm font-medium ml-2">
                      ${rate.rate}/{rate.unit}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : search ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No labor rates found
            </div>
          ) : null}

          {onAddNew && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Labor Rate
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}