'use client';

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import type { LaborRateTemplate } from '@prisma/client';

interface LaborRateCalculatorProps {
  rates: LaborRateTemplate[];
}

export function LaborRateCalculator({ rates }: LaborRateCalculatorProps) {
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const selectedRate = useMemo(() => {
    return rates.find(rate => rate.id === selectedRateId);
  }, [selectedRateId, rates]);

  const total = useMemo(() => {
    if (!selectedRate) return 0;
    return selectedRate.rate * quantity;
  }, [selectedRate, quantity]);

  const groupedRates = useMemo(() => {
    return rates.reduce<Record<string, LaborRateTemplate[]>>((acc, rate) => {
      const category = rate.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(rate);
      return acc;
    }, {});
  }, [rates]);

  const unitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      HR: 'hours',
      DAY: 'days',
      SQM: 'square meters',
      LM: 'linear meters',
      EA: 'units'
    };
    return labels[unit] || unit.toLowerCase();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Calculator</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rate-select">Select Labor Rate</Label>
            <Select value={selectedRateId} onValueChange={setSelectedRateId}>
              <SelectTrigger id="rate-select" className="w-full">
                <SelectValue placeholder="Choose a labor rate..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedRates).map(([category, categoryRates]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    {categoryRates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.id}>
                        {rate.activity} - {formatCurrency(rate.rate)}/{rate.unit}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRate && (
            <>
              <div>
                <Label htmlFor="quantity">
                  Quantity ({unitLabel(selectedRate.unit)})
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder={`Enter ${unitLabel(selectedRate.unit)}...`}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate:</span>
                    <span>{formatCurrency(selectedRate.rate)} per {selectedRate.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span>{quantity} {unitLabel(selectedRate.unit)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total Labor Cost:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {selectedRate.description && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Note:</span> {selectedRate.description}
                </div>
              )}
            </>
          )}
        </div>

        {rates.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No rates available. Upload a file to extract labor rates.
          </div>
        )}
      </div>
    </Card>
  );
}