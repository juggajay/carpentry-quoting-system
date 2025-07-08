import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { getLabourRates } from '@/app/(protected)/import/labor-rates/carpentry-rates-actions';

interface LaborRate {
  rate_id: number;
  category_name: string;
  activity: string;
  item_name?: string; // alias for activity
  description: string | null;
  unit: string;
  rate: number;
  typical_rate?: number; // alias for rate
  min_rate: number;
  max_rate: number;
}

interface LaborRateSelectorProps {
  onSelect: (labor: LaborRate) => void;
  onClose: () => void;
}

export function LaborRateSelector({ onSelect, onClose }: LaborRateSelectorProps) {
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch labor rates
  useEffect(() => {
    const fetchLaborRates = async () => {
      setIsLoading(true);
      try {
        const result = await getLabourRates(searchTerm, selectedCategory || undefined);
        if (result.success) {
          // Add aliases for compatibility
          const ratesWithAliases = result.data.map(rate => ({
            ...rate,
            item_name: rate.activity,
            typical_rate: rate.rate
          }));
          setLaborRates(ratesWithAliases);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(result.data.map(r => r.category_name))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching labor rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaborRates();
  }, [searchTerm, selectedCategory]);

  const handleSelect = (labor: LaborRate) => {
    onSelect(labor);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-dark-surface border border-gray-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Select Labor Rate</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-elevated rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-700 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search labor activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-elevated border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-dark-hover'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-dark-elevated text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Labor Rates Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : laborRates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No labor rates found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {laborRates.map((labor) => (
                  <button
                    key={labor.rate_id}
                    onClick={() => handleSelect(labor)}
                    className="p-4 bg-dark-elevated hover:bg-dark-hover border border-gray-700 rounded-lg transition-colors text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">
                          {labor.activity}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {labor.category_name}
                        </p>
                        {labor.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {labor.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-semibold text-emerald-400">
                          ${labor.rate}/{labor.unit}
                        </div>
                        {labor.min_rate !== labor.max_rate && (
                          <div className="text-xs text-gray-500">
                            ${labor.min_rate} - ${labor.max_rate}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}