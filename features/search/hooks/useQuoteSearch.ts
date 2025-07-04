import { useQuery } from "@tanstack/react-query";

interface SearchFilters {
  search: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

interface SearchResponse {
  quotes: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

async function searchQuotes(filters: SearchFilters): Promise<SearchResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append("search", filters.search);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.status) params.append("status", filters.status);
  if (filters.minAmount !== undefined) params.append("minAmount", filters.minAmount.toString());
  if (filters.maxAmount !== undefined) params.append("maxAmount", filters.maxAmount.toString());
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`/api/search?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to search quotes");
  }

  return response.json();
}

export function useQuoteSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ["quotes", "search", filters],
    queryFn: () => searchQuotes(filters),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}