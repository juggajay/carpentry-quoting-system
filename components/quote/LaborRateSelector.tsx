"use client";

import { useState, useEffect } from 'react';
import { getLabourRates, getCategoriesWithCounts } from '@/app/(protected)/import/labor-rates/carpentry-rates-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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

interface CategoryCount {
  category: string;
  count: number;
}

interface LaborRateSelectorProps {
  onSelect: (labor: LaborRate) => void;
  onClose: () => void;
}

export function LaborRateSelector({ onSelect, onClose }: LaborRateSelectorProps) {
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [filteredRates, setFilteredRates] = useState<LaborRate[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Fetch all labor rates and categories on mount
  useEffect(() => {
    fetchLaborRates();
    fetchCategories();
    loadFavorites();
  }, []);

  // Filter labor rates when category or search changes
  useEffect(() => {
    let filtered = laborRates;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rate => rate.category_name === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(rate => 
        rate.activity.toLowerCase().includes(search) ||
        rate.item_name.toLowerCase().includes(search) ||
        rate.description?.toLowerCase().includes(search)
      );
    }

    setFilteredRates(filtered);
  }, [laborRates, selectedCategory, searchTerm]);

  const fetchLaborRates = async () => {
    setLoading(true);
    try {
      const result = await getLabourRates();
      if (result.success) {
        // Map the data to include both category and category_name
        const mappedRates = result.data.map(rate => ({
          ...rate,
          category: rate.category_name,
          item_name: rate.activity,
          typical_rate: rate.rate
        }));
        setLaborRates(mappedRates);
      }
    } catch (error) {
      console.error('Failed to fetch labor rates:', error);
      toast.error('Failed to load labor rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await getCategoriesWithCounts();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('laborRateFavorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (rateId: number) => {
    const newFavorites = favorites.includes(rateId)
      ? favorites.filter(id => id !== rateId)
      : [...favorites, rateId];
    
    setFavorites(newFavorites);
    localStorage.setItem('laborRateFavorites', JSON.stringify(newFavorites));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[800px] md:w-[800px] sm:w-full bg-dark-elevated border-l border-gray-700 shadow-2xl z-50 flex flex-col mobile-modal md:rounded-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 ios-safe-area">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Select Labor Rate</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-surface rounded-lg transition-colors text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search labor activities by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-royal-blue focus:ring-1 focus:ring-royal-blue transition-colors"
            />
          </div>

          {/* Mobile Category Dropdown */}
          <div className="md:hidden mt-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-dark-surface border border-gray-700 rounded-md text-white focus:border-royal-blue focus:ring-1 focus:ring-royal-blue"
            >
              <option value="all">All Labor ({laborRates.length})</option>
              {categories.map(({ category, count }) => (
                <option key={category} value={category}>
                  {category} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-slate-400">
              {filteredRates.length} labor rates found
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-electric-magenta text-white' : 'bg-dark-surface text-gray-400 hover:bg-dark-navy'} transition-colors`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'grid' ? 'bg-electric-magenta text-white' : 'bg-dark-surface text-gray-400 hover:bg-dark-navy'} transition-colors`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-gray-700 p-4 overflow-y-auto bg-dark-surface/50 hidden md:block">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-electric-magenta text-white font-medium'
                    : 'hover:bg-dark-navy text-gray-300'
                }`}
              >
                All Labor
                <span className="float-right text-xs opacity-75">{laborRates.length}</span>
              </button>
              
              {categories.map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    selectedCategory === category
                      ? 'bg-electric-magenta text-white font-medium'
                      : 'hover:bg-dark-navy text-gray-300'
                  }`}
                >
                  {category}
                  <span className="float-right text-xs opacity-75">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Labor Rates List/Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 animate-pulse">Loading labor rates...</div>
              </div>
            ) : filteredRates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">No labor rates found</div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2 pb-20 md:pb-0">
                {filteredRates.map((rate) => (
                  <div
                    key={rate.rate_id}
                    className="p-4 bg-dark-surface border border-gray-700 rounded-lg hover:border-electric-magenta/50 transition-all cursor-pointer mobile-card md:rounded-lg"
                    onClick={() => onSelect(rate)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-white text-lg">{rate.item_name || rate.activity}</div>
                        <div className="text-sm text-slate-400 mt-1">{rate.category_name}</div>
                        {rate.description && (
                          <div className="text-sm text-gray-500 mt-1">{rate.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 md:ml-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-vibrant-cyan">
                            {formatPrice(rate.typical_rate || rate.rate)}
                          </div>
                          <div className="text-sm text-gray-500">per {rate.unit}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(rate.rate_id);
                          }}
                          className="p-2 md:p-1 hover:bg-dark-elevated rounded text-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          {favorites.includes(rate.rate_id) ? '⭐' : '☆'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(rate);
                          }}
                          className="px-4 py-2 md:px-3 md:py-1 bg-electric-magenta text-white rounded-md hover:bg-electric-magenta/90 transition-colors font-medium text-lg min-h-[44px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 md:pb-0">
                {filteredRates.map((rate) => (
                  <div
                    key={rate.rate_id}
                    className="p-4 bg-dark-surface border border-gray-700 rounded-lg hover:border-electric-magenta/50 transition-all cursor-pointer mobile-card md:rounded-lg"
                    onClick={() => onSelect(rate)}
                  >
                    <div className="font-medium text-white">{rate.item_name || rate.activity}</div>
                    <div className="text-sm text-gray-400 mt-1">{rate.category_name}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-semibold text-vibrant-cyan">
                        {formatPrice(rate.typical_rate || rate.rate)}
                      </span>
                      <span className="text-sm text-gray-500">per {rate.unit}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(rate.rate_id);
                        }}
                        className="p-2 md:p-1 hover:bg-dark-elevated rounded text-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        {favorites.includes(rate.rate_id) ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(rate);
                        }}
                        className="px-4 py-2 md:px-3 md:py-1 bg-electric-magenta text-white rounded-md hover:bg-electric-magenta/90 transition-colors font-medium min-h-[44px]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add New Labor Rate Button - Floating Action Button */}
        <button
          onClick={() => {
            // For now, we'll just show a toast. You can implement the add modal later
            toast.info('Add new labor rate functionality coming soon!');
          }}
          className="fixed md:absolute bottom-20 md:bottom-6 right-6 w-14 h-14 bg-electric-magenta text-white rounded-full shadow-lg hover:bg-electric-magenta/90 transition-colors flex items-center justify-center text-2xl font-bold z-50"
          title="Add New Labor Rate"
        >
          +
        </button>
      </motion.div>
    </AnimatePresence>
  );
}