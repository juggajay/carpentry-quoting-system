"use client";

import { useState, useCallback } from "react";
import { useDebounce } from "@/features/search/hooks/useDebounce";
import { useQuoteSearch } from "@/features/search/hooks/useQuoteSearch";
import SearchFilters from "@/features/search/components/SearchFilters";
import SearchResults from "@/features/search/components/SearchResults";
import ExportButton from "@/features/search/components/ExportButton";
import { toast } from "sonner";
import { useQuoteClipboard } from "@/lib/store/quote-clipboard-store";

interface SearchFilters {
  search: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
  });

  // Debounce the search term
  const debouncedSearch = useDebounce(filters.search, 300);

  // Use the search hook with debounced search
  const { data, isLoading, isError } = useQuoteSearch({
    ...filters,
    search: debouncedSearch,
  });

  const { addItems } = useQuoteClipboard();

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const handleCopyItems = async (quoteId: string) => {
    try {
      // In a real implementation, fetch the quote items
      const response = await fetch(`/api/quotes/${quoteId}/items`);
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const items = await response.json();
      addItems(items);
      toast.success(`${items.length} items copied to clipboard`);
    } catch {
      toast.error("Failed to copy items");
    }
  };

  const quotes = data?.quotes || [];
  const hasResults = quotes.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Search Quotes
          </h1>
          <p className="text-text-secondary">
            Find quotes by client, items, or reference number
          </p>
        </div>
        {hasResults && (
          <ExportButton
            filters={filters}
            disabled={isLoading}
          />
        )}
      </div>

      <SearchFilters onFiltersChange={handleFiltersChange} />

      {data && (
        <div className="text-sm text-text-secondary">
          Found {data.pagination.totalCount} quotes
        </div>
      )}

      <SearchResults
        quotes={quotes}
        isLoading={isLoading}
        isError={isError}
        onCopyItems={handleCopyItems}
      />
    </div>
  );
}