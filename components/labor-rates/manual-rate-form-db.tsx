'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  createLabourRate, 
  getCategories, 
  getUnits 
} from '@/app/(protected)/import/labor-rates/carpentry-rates-actions';

interface ManualRateFormDBProps {
  onRateAdded: () => void;
}

export function ManualRateFormDB({ onRateAdded }: ManualRateFormDBProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ category_id: number; category_name: string }>>([]);
  const [units, setUnits] = useState<Array<{ unit_id: number; unit_name: string; unit_abbreviation: string }>>([]);
  const [formData, setFormData] = useState({
    category: '',
    activity: '',
    unit: '',
    rate: '',
    description: ''
  });

  // Load categories and units on mount
  useEffect(() => {
    const loadData = async () => {
      const [categoriesResult, unitsResult] = await Promise.all([
        getCategories(),
        getUnits()
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      } else {
        toast.error('Failed to load categories');
      }

      if (unitsResult.success) {
        setUnits(unitsResult.data);
      } else {
        toast.error('Failed to load units');
      }
    };

    loadData();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.activity || formData.activity.trim().length < 3) {
      errors.activity = 'Activity must be at least 3 characters';
    }
    if (!formData.unit) errors.unit = 'Unit is required';
    
    const rate = parseFloat(formData.rate);
    if (!formData.rate || isNaN(rate) || rate <= 0) {
      errors.rate = 'Rate must be greater than 0';
    }
    if (rate > 9999.99) {
      errors.rate = 'Rate cannot exceed $9,999.99';
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Show first error
      toast.error(Object.values(errors)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createLabourRate({
        category: formData.category,
        activity: formData.activity,
        unit: formData.unit,
        rate: parseFloat(formData.rate),
        description: formData.description || undefined
      });

      if (result.success) {
        toast.success('Labor rate added successfully');
        setFormData({
          category: '',
          activity: '',
          unit: '',
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
                  {categories.map((category) => (
                    <SelectItem key={category.category_id} value={category.category_name}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_abbreviation}>
                      {unit.unit_name} ({unit.unit_abbreviation})
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