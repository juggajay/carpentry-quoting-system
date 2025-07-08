import { useState, useEffect } from 'react';
import { searchLabourRates } from '@/app/(protected)/import/labor-rates/carpentry-rates-actions';
import { AddLaborRateModal } from './AddLaborRateModal';

interface LaborRate {
  rate_id: number;
  category: string;
  category_name?: string;
  activity: string;
  item_name: string;
  description: string | null;
  unit: string;
  rate: number;
  typical_rate: number;
  min_rate: number;
  max_rate: number;
}

interface LaborRateSelectorProps {
  onSelect: (labor: LaborRate) => void;
  onClose: () => void;
}

export function LaborRateSelector({ onSelect, onClose }: LaborRateSelectorProps) {
  const [search, setSearch] = useState('');
  const [rates, setRates] = useState<LaborRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const debounced = setTimeout(() => {
      loadRates();
    }, 300);
    return () => clearTimeout(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadRates = async () => {
    setLoading(true);
    try {
      const result = await searchLabourRates(search);
      if (result.success) {
        // Map the data to match expected structure
        const mappedRates = result.data.map(rate => ({
          ...rate,
          category: rate.category_name,
          item_name: rate.activity,
          typical_rate: rate.rate
        }));
        setRates(mappedRates);
      }
    } catch (error) {
      console.error('Error loading rates:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Select Labor Rate</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search labor activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white mb-4"
        />

        <div className="overflow-y-auto max-h-96 mb-4">
          {loading ? (
            <div className="text-center py-4 text-gray-400">Loading...</div>
          ) : rates.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No rates found</div>
          ) : (
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.rate_id}
                  onClick={() => onSelect(rate)}
                  className="p-3 bg-gray-800 rounded-md hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{rate.item_name}</div>
                      <div className="text-gray-400 text-sm">{rate.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">${rate.typical_rate}</div>
                      <div className="text-gray-400 text-sm">per {rate.unit}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add New Labor Rate
        </button>

        {showAddForm && (
          <AddLaborRateModal
            onSuccess={(newRate) => {
              onSelect(newRate);
              setShowAddForm(false);
            }}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
}