// components/quote/MaterialSelectorPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import { Material } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface MaterialSelectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materials: Material[]) => void;
  multiple?: boolean;
}

interface CategoryCount {
  category: string;
  count: number;
}

export function MaterialSelectorPanel({
  isOpen,
  onClose,
  onSelect,
  multiple = false
}: MaterialSelectorPanelProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Material[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Fetch all materials and categories on mount
  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
      loadFavorites();
    }
  }, [isOpen]);

  // Filter materials when category or search changes
  useEffect(() => {
    let filtered = materials;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(search) ||
        m.description?.toLowerCase().includes(search) ||
        m.sku?.toLowerCase().includes(search)
      );
    }

    setFilteredMaterials(filtered);
  }, [materials, selectedCategory, searchTerm]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
        
        // Calculate category counts
        const categoryMap = new Map<string, number>();
        data.forEach((material: Material) => {
          const cat = material.category || 'Uncategorized';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
        
        const counts: CategoryCount[] = Array.from(categoryMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);
        
        setCategories(counts);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('materialFavorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (materialId: string) => {
    const newFavorites = favorites.includes(materialId)
      ? favorites.filter(id => id !== materialId)
      : [...favorites, materialId];
    
    setFavorites(newFavorites);
    localStorage.setItem('materialFavorites', JSON.stringify(newFavorites));
  };

  const handleSelect = (material: Material) => {
    if (multiple) {
      const isSelected = selectedItems.some(item => item.id === material.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(item => item.id !== material.id));
      } else {
        setSelectedItems([...selectedItems, material]);
      }
    } else {
      onSelect([material]);
      onClose();
    }
  };

  const handleAddSelected = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
      setSelectedItems([]);
      onClose();
    }
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
      {isOpen && (
        <>
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
            className="fixed right-0 top-0 h-full w-[600px] bg-dark-elevated border-l border-gray-700 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Select Materials</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-dark-surface rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search materials by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-royal-blue focus:ring-1 focus:ring-royal-blue transition-colors"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-slate-400">
                  {filteredMaterials.length} materials found
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
              <div className="w-48 border-r border-gray-700 p-4 overflow-y-auto">
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
                    All Materials
                    <span className="float-right text-xs opacity-75">{materials.length}</span>
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

              {/* Materials List/Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400 animate-pulse">Loading materials...</div>
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">No materials found</div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-2">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material.id}
                        className={`p-4 bg-dark-surface border border-gray-700 rounded-lg hover:border-electric-magenta/50 transition-all cursor-pointer ${
                          selectedItems.some(item => item.id === material.id) ? 'bg-electric-magenta/10 border-electric-magenta' : ''
                        }`}
                        onClick={() => handleSelect(material)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-white">{material.name}</div>
                            {material.description && (
                              <div className="text-sm text-slate-400 mt-1">{material.description}</div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              {material.sku && <span className="text-sm text-gray-500">{material.sku}</span>}
                              <span className="text-lg font-semibold text-vibrant-cyan">
                                {formatPrice(material.pricePerUnit)}
                              </span>
                              <span className="text-sm text-gray-500">per {material.unit}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(material.id);
                              }}
                              className="p-1 hover:bg-dark-elevated rounded text-2xl transition-colors"
                            >
                              {favorites.includes(material.id) ? '⭐' : '☆'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(material);
                              }}
                              className="px-3 py-1 bg-electric-magenta text-white rounded-md hover:bg-electric-magenta/90 transition-colors font-medium"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material.id}
                        className={`p-4 border border-slate-700 rounded-lg hover:border-emerald-600 transition-colors cursor-pointer ${
                          selectedItems.some(item => item.id === material.id) ? 'bg-emerald-600/10 border-emerald-600' : ''
                        }`}
                        onClick={() => handleSelect(material)}
                      >
                        <div className="font-medium text-white">{material.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{material.category}</div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-semibold text-vibrant-cyan">
                            {formatPrice(material.pricePerUnit)}
                          </span>
                          <span className="text-sm text-gray-500">per {material.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Multi-select actions */}
            {multiple && selectedItems.length > 0 && (
              <div className="p-4 border-t border-gray-700 bg-dark-surface">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {selectedItems.length} items selected
                  </span>
                  <button
                    onClick={handleAddSelected}
                    className="btn btn-primary"
                  >
                    Add Selected Items
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}