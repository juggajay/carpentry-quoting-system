"use client";

import { LineItem } from '@/types';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ExtendedLineItem extends LineItem {
  material?: {
    name: string;
    pricePerUnit: number;
    unit: string;
  };
  laborRate?: {
    item_name: string;
    rate: number;
    unit: string;
  };
  notes?: string;
}

interface LineItemCardProps {
  item: ExtendedLineItem;
  onUpdate: (field: keyof ExtendedLineItem, value: string | number) => void;
  onDelete: () => void;
  onSelectMaterial: () => void;
  onSelectLabor: () => void;
  index: number;
}

export function LineItemCard({
  item,
  onUpdate,
  onDelete,
  onSelectMaterial,
  onSelectLabor,
  index
}: LineItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const total = item.total || ((item.quantity || 0) * (item.unitPrice || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="mobile-card mb-3"
    >
      {/* Card Header - Always Visible */}
      <div 
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 pr-4">
          <div className="font-semibold text-white text-lg">
            {item.description || 'New Line Item'}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {item.quantity || 0} {item.unit || 'unit'} × {formatPrice(item.unitPrice || 0)}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-vibrant-cyan">
            {formatPrice(total)}
          </div>
          <button className="text-gray-400 hover:text-white mt-1">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-gray-700"
        >
          {/* Description Input */}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            <input
              type="text"
              value={item.description || ''}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Enter description"
              className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-royal-blue focus:ring-1 focus:ring-royal-blue"
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Quantity</label>
              <input
                type="number"
                value={item.quantity || ''}
                onChange={(e) => onUpdate('quantity', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-royal-blue focus:ring-1 focus:ring-royal-blue"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Unit</label>
              <select
                value={item.unit || 'unit'}
                onChange={(e) => onUpdate('unit', e.target.value)}
                className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white focus:border-royal-blue focus:ring-1 focus:ring-royal-blue"
              >
                <option value="unit">Unit</option>
                <option value="sqm">m²</option>
                <option value="lm">Linear m</option>
                <option value="hours">Hours</option>
                <option value="each">Each</option>
                <option value="day">Day</option>
              </select>
            </div>
          </div>

          {/* Material Selection */}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Material</label>
            <button
              onClick={onSelectMaterial}
              className="w-full px-4 py-3 bg-dark-surface border border-gray-700 rounded-md text-left hover:border-electric-magenta transition-colors min-h-[44px]"
            >
              {item.material ? (
                <div>
                  <div className="text-white font-medium">{item.material.name}</div>
                  <div className="text-sm text-gray-400">
                    {formatPrice(item.material.pricePerUnit)} per {item.material.unit}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Select Material →</span>
              )}
            </button>
          </div>

          {/* Labor Selection */}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Labor</label>
            <button
              onClick={onSelectLabor}
              className="w-full px-4 py-3 bg-dark-surface border border-gray-700 rounded-md text-left hover:border-electric-magenta transition-colors min-h-[44px]"
            >
              {item.laborRate ? (
                <div>
                  <div className="text-white font-medium">{item.laborRate.item_name}</div>
                  <div className="text-sm text-gray-400">
                    {formatPrice(item.laborRate.rate)} per {item.laborRate.unit}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Select Labor →</span>
              )}
            </button>
          </div>

          {/* Price Breakdown */}
          <div className="bg-dark-surface rounded-lg p-3 mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Material Cost:</span>
              <span className="text-white">{formatPrice(item.unitPrice || 0)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Labor Cost:</span>
              <span className="text-white">{formatPrice(item.laborRate?.rate || 0)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
              <span className="text-gray-400">Total per {item.unit || 'unit'}:</span>
              <span className="text-white font-medium">
                {formatPrice((item.unitPrice || 0) + (item.laborRate?.rate || 0))}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Notes</label>
            <textarea
              value={item.notes || ''}
              onChange={(e) => onUpdate('notes', e.target.value)}
              placeholder="Add any notes..."
              rows={2}
              className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white placeholder-gray-500 focus:border-royal-blue focus:ring-1 focus:ring-royal-blue resize-none"
            />
          </div>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-600/20 text-red-500 rounded-md hover:bg-red-600/30 transition-colors font-medium"
          >
            Delete Line Item
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}