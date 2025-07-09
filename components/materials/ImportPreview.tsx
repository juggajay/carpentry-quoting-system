'use client';

import { useState, useMemo } from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

interface ScrapedProduct {
  id?: string;
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

interface ImportPreviewProps {
  products: ScrapedProduct[];
  onImport: (selectedProducts: ScrapedProduct[]) => Promise<void>;
  isImporting?: boolean;
}

export function ImportPreview({ products, onImport, isImporting }: ImportPreviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const productStats = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        if (product.status === 'new') acc.new++;
        else if (product.status === 'existing') acc.existing++;
        else if (product.status === 'error') acc.errors++;
        return acc;
      },
      { new: 0, existing: 0, errors: 0 }
    );
  }, [products]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const validIds = products
        .filter(p => p.status !== 'error')
        .map((_, index) => index.toString());
      setSelectedIds(new Set(validIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === products.filter(p => p.status !== 'error').length);
  };

  const handleImport = async () => {
    const selectedProducts = products.filter((_, index) => 
      selectedIds.has(index.toString())
    );
    
    if (selectedProducts.length === 0) {
      toast.error('Please select products to import');
      return;
    }

    try {
      await onImport(selectedProducts);
      setSelectedIds(new Set());
      setSelectAll(false);
    } catch {
      toast.error('Failed to import products');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-green-600">New</Badge>;
      case 'existing':
        return <Badge variant="info">Existing</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between flex-shrink-0 pb-2">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-600 rounded-full" />
            New: {productStats.new}
          </span>
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-400 rounded-full" />
            Existing: {productStats.existing}
          </span>
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-600 rounded-full" />
            Errors: {productStats.errors}
          </span>
        </div>
        
        <Button
          onClick={handleImport}
          disabled={isImporting || selectedIds.size === 0}
          className="bg-primary-light hover:bg-primary"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>Import {selectedIds.size} Selected</>
          )}
        </Button>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden flex-1 min-h-0">
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
          <thead className="bg-dark-surface border-b border-gray-800">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Unit</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-100">Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-100">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products.map((product, index) => (
              <tr key={index} className={product.status === 'error' ? 'opacity-60' : 'hover:bg-dark-surface/50'}>
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(index.toString())}
                    onCheckedChange={(checked) => 
                      handleSelectProduct(index.toString(), checked as boolean)
                    }
                    disabled={product.status === 'error'}
                    aria-label={`Select ${product.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(product.status)}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.error && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {product.error}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.sku || '-'}
                </td>
                <td className="px-4 py-3">
                  {product.category && (
                    <Badge variant="default">{product.category}</Badge>
                  )}
                </td>
                <td className="px-4 py-3">{product.unit}</td>
                <td className="px-4 py-3 text-right font-medium">
                  ${product.pricePerUnit ? product.pricePerUnit.toFixed(2) : '0.00'}
                  {product.gstInclusive && (
                    <span className="text-xs text-gray-600 ml-1">inc GST</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.inStock ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}