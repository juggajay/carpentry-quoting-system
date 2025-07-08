'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Unit } from '@prisma/client';
import { createLaborRateTemplate } from '@/app/(protected)/import/labor-rates/actions';

const CATEGORIES = [
  'framing',
  'doors',
  'windows',
  'decking',
  'roofing',
  'flooring',
  'plumbing',
  'electrical',
  'painting',
  'general',
  'other'
];

const UNITS: { value: Unit; label: string }[] = [
  { value: 'HR', label: 'Hour (HR)' },
  { value: 'DAY', label: 'Day' },
  { value: 'SQM', label: 'Square Meter (m²)' },
  { value: 'LM', label: 'Linear Meter (m)' },
  { value: 'EA', label: 'Each' },
];

interface ManualRateFormProps {
  onRateAdded: () => void;
}

export function ManualRateForm({ onRateAdded }: ManualRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    activity: '',
    unit: 'HR' as Unit,
    rate: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.activity || !formData.rate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Please enter a valid rate amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createLaborRateTemplate({
        category: formData.category,
        activity: formData.activity,
        unit: formData.unit,
        rate,
        description: formData.description || undefined,
        confidence: 1.0, // Manual entry has full confidence
        source: 'Manual Entry'
      });

      if (result.success) {
        toast.success('Labor rate added successfully');
        setFormData({
          category: '',
          activity: '',
          unit: 'HR',
          rate: '',
          description: ''
        });
        onRateAdded();
      } else {
        toast.error(result.error || 'Failed to add labor rate');
      }
    } catch (error) {
      console.error('Error adding labor rate:', error);
      toast.error('An error occurred while adding the rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Labor Rate Manually</h3>
          <p className="text-sm text-muted-foreground">
            Add individual labor rates for specific activities
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value as Unit })}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Activity *</Label>
            <Input
              id="activity"
              placeholder="e.g., Install door frame, Frame walls, etc."
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Rate ($) *</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              placeholder="e.g., 85.00"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Additional details about this rate"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Adding...' : 'Add Labor Rate'}
          </Button>
        </form>
      </div>
    </Card>
  );
}