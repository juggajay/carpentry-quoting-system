'use client';

import { useState, useEffect } from 'react';
import { Download, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import PageContainer from '@/components/layout/PageContainer';
import { LaborRateUploader } from '@/components/labor-rates/labor-rate-uploader';
import { LaborRateTable } from '@/components/labor-rates/labor-rate-table';
import { LaborRateCalculator } from '@/components/labor-rates/labor-rate-calculator';
import { ExtractionProgress } from '@/components/labor-rates/extraction-progress';
import { ManualRateForm } from '@/components/labor-rates/manual-rate-form';
import { getLaborRateTemplates, deleteLaborRateTemplates } from './actions';
import { toast } from 'sonner';
import { NormalizedRate } from '@/lib/rate-extraction/rate-normalizer';
import type { LaborRateTemplate } from '@prisma/client';

export default function LaborRatesPage() {
  const [rates, setRates] = useState<LaborRateTemplate[]>([]);
  const [extractedRates, setExtractedRates] = useState<NormalizedRate[]>([]);
  const [extractionStats, setExtractionStats] = useState<{
    totalExtracted: number;
    validRates: number;
    invalidRates: number;
    byCategory: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setIsLoading(true);
    const result = await getLaborRateTemplates();
    
    if (result.success) {
      setRates(result.data);
    } else {
      toast.error(result.error || 'Failed to load labor rates');
    }
    
    setIsLoading(false);
  };

  const handleRatesExtracted = (newRates: NormalizedRate[]) => {
    setExtractedRates(newRates);
    
    // Calculate stats
    const stats = {
      totalExtracted: newRates.length,
      validRates: newRates.filter(r => r.isValid).length,
      invalidRates: newRates.filter(r => !r.isValid).length,
      byCategory: newRates.reduce((acc, rate) => {
        const category = rate.category || 'general';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    setExtractionStats(stats);
  };

  const handleSaveComplete = () => {
    setExtractedRates([]);
    setExtractionStats(null);
    loadRates();
  };

  const handleCancelExtraction = () => {
    setExtractedRates([]);
    setExtractionStats(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const result = await deleteLaborRateTemplates(Array.from(selectedIds));
    
    if (result.success) {
      toast.success(`Deleted ${result.deleted} rates`);
      setSelectedIds(new Set());
      loadRates();
    } else {
      toast.error(result.error || 'Failed to delete rates');
    }
  };

  const handleExportRates = () => {
    const data = rates.map(rate => ({
      Category: rate.category,
      Activity: rate.activity,
      Rate: rate.rate,
      Unit: rate.unit,
      Description: rate.description || '',
      Confidence: rate.confidence ? `${Math.round(rate.confidence * 100)}%` : '',
      Source: rate.source || ''
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labor-rates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title="Labor Rate Library"
      description="Extract and manage labor rates from Excel documents or add them manually"
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
          {rates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportRates}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      }
    >

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {extractedRates.length === 0 ? (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Add Labor Rates</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManualForm(!showManualForm)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showManualForm ? 'Upload File' : 'Add Manually'}
                  </Button>
                </div>
                
                {showManualForm ? (
                  <ManualRateForm onRateAdded={loadRates} />
                ) : (
                  <LaborRateUploader onRatesExtracted={handleRatesExtracted} />
                )}
              </div>
              
              <LaborRateTable 
                rates={rates} 
                onRatesChange={loadRates}
              />
            </>
          ) : extractionStats ? (
            <ExtractionProgress
              rates={extractedRates}
              stats={extractionStats}
              onSave={handleSaveComplete}
              onCancel={handleCancelExtraction}
            />
          ) : null}
        </div>

        <div>
          <LaborRateCalculator rates={rates} />
        </div>
      </div>
    </PageContainer>
  );
}