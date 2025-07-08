'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LaborRateSelector } from './labor-rate-selector';

interface QuoteLaborItem {
  id: string;
  type: 'labour';
  rateId?: number;
  activity: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  description?: string;
}

interface QuoteLaborItemProps {
  item: QuoteLaborItem;
  onUpdate: (item: QuoteLaborItem) => void;
  onDelete: (id: string) => void;
  onOpenAddLabor?: () => void;
}

export function QuoteLaborItem({ item, onUpdate, onDelete, onOpenAddLabor }: QuoteLaborItemProps) {
  const [quantity, setQuantity] = useState(item.quantity.toString());

  const handleLaborSelect = (labor: any) => {
    const updatedItem = {
      ...item,
      rateId: labor.rate_id,
      activity: labor.activity,
      category: labor.category_name,
      unit: labor.unit,
      rate: labor.rate,
      description: labor.description || '',
      total: item.quantity * labor.rate
    };
    onUpdate(updatedItem);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const qty = parseFloat(value) || 0;
    const updatedItem = {
      ...item,
      quantity: qty,
      total: qty * item.rate
    };
    onUpdate(updatedItem);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 border-b">
      <div className="col-span-4">
        <LaborRateSelector 
          onSelect={handleLaborSelect}
          onAddNew={onOpenAddLabor}
        />
        {item.activity && (
          <div className="text-sm text-muted-foreground mt-1">
            {item.activity} - {item.category}
          </div>
        )}
      </div>
      
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          placeholder="Quantity"
        />
      </div>
      
      <div className="col-span-2 text-center">
        <span className="text-sm">{item.unit}</span>
      </div>
      
      <div className="col-span-2 text-right">
        <span className="font-medium">${item.rate.toFixed(2)}</span>
      </div>
      
      <div className="col-span-1 text-right">
        <span className="font-semibold">${item.total.toFixed(2)}</span>
      </div>
      
      <div className="col-span-1 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}