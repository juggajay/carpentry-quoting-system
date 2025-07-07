'use client';

import { useState } from 'react';
import { Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { updateLaborRateTemplate, deleteLaborRateTemplate } from '@/app/(protected)/import/labor-rates/actions';
import { formatCurrency } from '@/lib/utils';
import type { LaborRateTemplate } from '@prisma/client';

interface LaborRateTableProps {
  rates: LaborRateTemplate[];
  onRatesChange: () => void;
}

interface GroupedRates {
  [category: string]: LaborRateTemplate[];
}

const CATEGORY_LABELS: Record<string, string> = {
  framing: 'Framing',
  doors: 'Doors & Hardware',
  windows: 'Windows',
  decking: 'Decking',
  cladding: 'Cladding & Lining',
  general: 'General Labor'
};

export function LaborRateTable({ rates, onRatesChange }: LaborRateTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ rate: number; description: string }>({
    rate: 0,
    description: ''
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['general']));

  // Group rates by category
  const groupedRates = rates.reduce<GroupedRates>((acc, rate) => {
    const category = rate.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rate);
    return acc;
  }, {});

  const handleEdit = (rate: LaborRateTemplate) => {
    setEditingId(rate.id);
    setEditValues({
      rate: rate.rate,
      description: rate.description || ''
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const result = await updateLaborRateTemplate(editingId, editValues);
    
    if (result.success) {
      toast.success('Rate updated successfully');
      setEditingId(null);
      onRatesChange();
    } else {
      toast.error(result.error || 'Failed to update rate');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ rate: 0, description: '' });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteLaborRateTemplate(id);
    
    if (result.success) {
      toast.success('Rate deleted successfully');
      onRatesChange();
    } else {
      toast.error(result.error || 'Failed to delete rate');
    }
  };

  const handleSelectAll = (category: string) => {
    const categoryRates = groupedRates[category] || [];
    const allSelected = categoryRates.every(rate => selectedIds.has(rate.id));
    
    if (allSelected) {
      // Deselect all in this category
      const newSelected = new Set(selectedIds);
      categoryRates.forEach(rate => newSelected.delete(rate.id));
      setSelectedIds(newSelected);
    } else {
      // Select all in this category
      const newSelected = new Set(selectedIds);
      categoryRates.forEach(rate => newSelected.add(rate.id));
      setSelectedIds(newSelected);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getConfidenceColor = (confidence?: number | null) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number | null) => {
    if (!confidence) return '';
    const percent = Math.round(confidence * 100);
    return `${percent}%`;
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedRates).map(([category, categoryRates]) => {
        const isExpanded = expandedCategories.has(category);
        const allSelected = categoryRates.every(rate => selectedIds.has(rate.id));
        const someSelected = categoryRates.some(rate => selectedIds.has(rate.id));

        return (
          <Collapsible
            key={category}
            open={isExpanded}
            onOpenChange={() => toggleCategory(category)}
          >
            <div className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={!allSelected && someSelected}
                      onCheckedChange={() => handleSelectAll(category)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <h3 className="font-medium">
                      {CATEGORY_LABELS[category] || category} ({categoryRates.length})
                    </h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 w-10"></th>
                        <th className="text-left p-3">Activity</th>
                        <th className="text-left p-3">Rate</th>
                        <th className="text-left p-3">Unit</th>
                        <th className="text-left p-3">Description</th>
                        <th className="text-left p-3 w-20">Confidence</th>
                        <th className="text-left p-3 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRates.map((rate) => (
                        <tr key={rate.id} className="border-b hover:bg-muted/20">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedIds.has(rate.id)}
                              onCheckedChange={() => handleToggleSelect(rate.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{rate.activity}</td>
                          <td className="p-3">
                            {editingId === rate.id ? (
                              <Input
                                type="number"
                                value={editValues.rate}
                                onChange={(e) => setEditValues({
                                  ...editValues,
                                  rate: parseFloat(e.target.value) || 0
                                })}
                                className="w-24"
                                step="0.01"
                              />
                            ) : (
                              formatCurrency(rate.rate)
                            )}
                          </td>
                          <td className="p-3">{rate.unit}</td>
                          <td className="p-3">
                            {editingId === rate.id ? (
                              <Input
                                value={editValues.description}
                                onChange={(e) => setEditValues({
                                  ...editValues,
                                  description: e.target.value
                                })}
                                className="w-full"
                                placeholder="Add description..."
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {rate.description || '-'}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`text-sm font-medium ${getConfidenceColor(rate.confidence)}`}>
                              {getConfidenceLabel(rate.confidence)}
                            </span>
                          </td>
                          <td className="p-3">
                            {editingId === rate.id ? (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSave}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancel}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(rate)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(rate.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {rates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No labor rates found. Upload a file to extract rates.
        </div>
      )}
    </div>
  );
}