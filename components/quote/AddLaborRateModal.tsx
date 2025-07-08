import { useState } from 'react';
import { createLabourRate } from '@/app/(protected)/import/labor-rates/carpentry-rates-actions';

interface LaborRate {
  rate_id: number;
  category: string;
  category_name: string;
  activity: string;
  item_name: string;
  description: string | null;
  unit: string;
  rate: number;
  typical_rate: number;
  min_rate: number;
  max_rate: number;
}

interface AddLaborRateModalProps {
  onSuccess: (newRate: LaborRate) => void;
  onClose: () => void;
}

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

const UNITS = [
  { value: 'm²', label: 'Square Meter (m²)' },
  { value: 'lm', label: 'Linear Meter (lm)' },
  { value: 'item', label: 'Per Item' },
  { value: 'hr', label: 'Per Hour' },
  { value: 'set', label: 'Per Set' }
];

export function AddLaborRateModal({ onSuccess, onClose }: AddLaborRateModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    activity: '',
    unit: 'm²',
    rate: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.category || !formData.activity || !formData.rate) {
      setError('Please fill in all required fields');
      return;
    }

    const rateValue = parseFloat(formData.rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      setError('Please enter a valid rate amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createLabourRate({
        category: formData.category,
        activity: formData.activity,
        unit: formData.unit,
        rate: rateValue,
        description: formData.description || undefined
      });

      if (result.success) {
        // Create a new rate object that matches the expected structure
        const newRate = {
          rate_id: result.rateId!,
          category: formData.category,
          category_name: formData.category,
          activity: formData.activity,
          item_name: formData.activity,
          description: formData.description || null,
          unit: formData.unit,
          rate: rateValue,
          typical_rate: rateValue,
          min_rate: rateValue,
          max_rate: rateValue
        };
        onSuccess(newRate);
      } else {
        setError(result.error || 'Failed to add labor rate');
      }
    } catch (error) {
      console.error('Error adding labor rate:', error);
      setError('An error occurred while adding the rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Add New Labor Rate</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-300 mb-1">
              Activity *
            </label>
            <input
              id="activity"
              type="text"
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              placeholder="e.g., Install door frame"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-1">
                Unit *
              </label>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                required
              >
                {UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-300 mb-1">
                Rate ($) *
              </label>
              <input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="85.00"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this rate"
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}