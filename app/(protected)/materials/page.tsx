'use client';

import { useState, useEffect } from 'react';
import { Plus, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PageContainer from '@/components/layout/PageContainer';
import { MaterialImportButton } from '@/components/features/materials/MaterialImportButton';
import { toast } from 'sonner';
import type { Material } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ScrapingDiagnostics } from '@/components/features/materials/ScrapingDiagnostics';
import { ImportJobsList } from '@/components/materials/ImportJobsList';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      
      if (response.ok) {
        setMaterials(Array.isArray(data) ? data : data.materials || []);
      } else {
        toast.error('Failed to load materials');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    // TODO: Implement delete endpoint
    toast.info('Delete functionality not yet implemented');
  };

  const handleExportMaterials = () => {
    const data = materials.map(material => ({
      Name: material.name,
      Description: material.description || '',
      SKU: material.sku || '',
      Supplier: material.supplier || '',
      Category: material.category || '',
      Unit: material.unit,
      'Price Per Unit': material.pricePerUnit,
      'GST Inclusive': material.gstInclusive ? 'Yes' : 'No',
      'In Stock': material.inStock ? 'Yes' : 'No',
      'Last Updated': material.updatedAt
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMaterial = () => {
    // TODO: Implement add material dialog
    toast.info('Add material dialog not yet implemented');
  };

  return (
    <PageContainer
      title="Materials Management"
      description="Manage your materials catalog and pricing"
      actions={
        <div className="flex space-x-3">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          )}
          {materials.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMaterials}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          <MaterialImportButton onImportComplete={loadMaterials} />
          <Button
            size="sm"
            onClick={handleAddMaterial}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      }
    >
      <ImportJobsList />
      
      <div className="bg-dark-elevated rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading materials...
          </div>
        ) : materials.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No materials found in your catalog.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by importing materials from a supplier website or adding them manually.
            </p>
            <div className="flex justify-center gap-2">
              <MaterialImportButton onImportComplete={loadMaterials} />
              <Button onClick={handleAddMaterial}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-surface border-b border-gray-800">
                <tr>
                  <th className="p-4 text-left font-medium text-gray-100">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === materials.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(materials.map(m => m.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  </th>
                  <th className="p-4 text-left font-medium text-gray-100">Name</th>
                  <th className="p-4 text-left font-medium text-gray-100">Category</th>
                  <th className="p-4 text-left font-medium text-gray-100">Supplier</th>
                  <th className="p-4 text-left font-medium text-gray-100">Unit</th>
                  <th className="p-4 text-right font-medium text-gray-100">Price</th>
                  <th className="p-4 text-left font-medium text-gray-100">Status</th>
                  <th className="p-4 text-left font-medium text-gray-100">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-dark-surface/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(material.id)}
                        onChange={(e) => {
                          const newIds = new Set(selectedIds);
                          if (e.target.checked) {
                            newIds.add(material.id);
                          } else {
                            newIds.delete(material.id);
                          }
                          setSelectedIds(newIds);
                        }}
                      />
                    </td>
                    <td className="p-4 font-medium">
                      {material.name}
                      {material.description && (
                        <p className="text-sm text-muted-foreground">
                          {material.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {material.category && (
                        <Badge variant="default">
                          {material.category}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">{material.supplier || '-'}</td>
                    <td className="p-4">{material.unit}</td>
                    <td className="p-4 text-right">
                      {formatCurrency(material.pricePerUnit)}
                      {!material.gstInclusive && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +GST
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={material.inStock ? "success" : "default"}>
                        {material.inStock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {material.lastScrapedAt ? (
                        <div>
                          <div>Scraped: {new Date(material.lastScrapedAt).toLocaleDateString()}</div>
                          {material.scraperType && (
                            <Badge variant="info" size="sm">
                              {material.scraperType}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        new Date(material.updatedAt).toLocaleDateString()
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scraping Diagnostics - Hidden by default, shown with ?debug=true */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'true' && (
        <div className="mt-8">
          <ScrapingDiagnostics />
        </div>
      )}
    </PageContainer>
  );
}