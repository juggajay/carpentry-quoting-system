'use client';

import { CheckCircle2, XCircle, AlertCircle, FileSearch, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { saveLaborRateTemplates } from '@/app/(protected)/import/labor-rates/actions';
import { NormalizedRate } from '@/lib/rate-extraction/rate-normalizer';

interface ExtractionProgressProps {
  rates: NormalizedRate[];
  stats: {
    totalExtracted: number;
    validRates: number;
    invalidRates: number;
    byCategory: Record<string, number>;
  };
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  framing: 'Framing',
  doors: 'Doors & Hardware',
  windows: 'Windows',
  decking: 'Decking',
  cladding: 'Cladding & Lining',
  general: 'General Labor'
};

export function ExtractionProgress({ rates, stats, onSave, onCancel }: ExtractionProgressProps) {
  const validRates = rates.filter(r => r.isValid);
  const successRate = stats.totalExtracted > 0 
    ? Math.round((stats.validRates / stats.totalExtracted) * 100) 
    : 0;

  const handleSaveRates = async () => {
    const ratesToSave = validRates.map(rate => ({
      category: rate.category,
      activity: rate.activity,
      unit: rate.unit,
      rate: rate.rate,
      description: rate.description,
      source: rate.source,
      confidence: rate.confidence
    }));

    const result = await saveLaborRateTemplates(ratesToSave);
    
    if (result.success) {
      toast.success(`Saved ${result.saved} labor rates successfully`);
      onSave();
    } else {
      toast.error('Failed to save some rates');
      if (result.errors.length > 0) {
        console.error('Save errors:', result.errors);
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <FileSearch className="h-5 w-5" />
              <span>Extraction Results</span>
            </h3>
            <span className="text-sm text-muted-foreground">
              {stats.totalExtracted} rates found
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Success Rate</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{stats.validRates}</div>
                <div className="text-sm text-muted-foreground">Valid Rates</div>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-2xl font-bold">{stats.invalidRates}</div>
                <div className="text-sm text-muted-foreground">Invalid Rates</div>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(
                    validRates.reduce((sum, r) => sum + r.confidence, 0) / validRates.length * 100
                  )}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rates by Category</h4>
              <div className="space-y-1">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleSaveRates}
            disabled={validRates.length === 0}
            className="flex-1"
          >
            Save {validRates.length} Valid Rates
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>

        {stats.invalidRates > 0 && (
          <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Some rates were invalid</p>
              <p className="text-xs mt-1">
                {stats.invalidRates} rates were outside reasonable ranges or had other validation issues.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}