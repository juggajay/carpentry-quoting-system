"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
  }) => void;
}

export default function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [minAmount, setMinAmount] = useState(searchParams.get("minAmount") || "");
  const [maxAmount, setMaxAmount] = useState(searchParams.get("maxAmount") || "");

  // Update URL params
  const updateSearchParams = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange({
      search,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: status || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
  }, [search, dateFrom, dateTo, status, minAmount, maxAmount, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateSearchParams({ search: value });
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setMinAmount("");
    setMaxAmount("");
    updateSearchParams({
      search: "",
      dateFrom: "",
      dateTo: "",
      status: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  const hasActiveFilters = dateFrom || dateTo || status || minAmount || maxAmount;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
          <Input
            type="text"
            placeholder="Search quotes, clients, or items..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showAdvanced || hasActiveFilters ? "primary" : "secondary"}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="mr-2">≡</span>
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-600/20 text-xs px-1.5 py-0.5 rounded-full">
              {[dateFrom, dateTo, status, minAmount, maxAmount].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-background-tertiary border border-border rounded-lg p-4 space-y-4">
              {/* Date Range */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      updateSearchParams({ dateFrom: e.target.value });
                    }}
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      updateSearchParams({ dateTo: e.target.value });
                    }}
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    updateSearchParams({ status: e.target.value });
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-background focus:border-primary-600 hover:border-border hover:bg-background-tertiary transition-all duration-200"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="VIEWED">Viewed</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={minAmount}
                    onChange={(e) => {
                      setMinAmount(e.target.value);
                      updateSearchParams({ minAmount: e.target.value });
                    }}
                    placeholder="Min amount"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => {
                      setMaxAmount(e.target.value);
                      updateSearchParams({ maxAmount: e.target.value });
                    }}
                    placeholder="Max amount"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <span className="mr-2">×</span>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}