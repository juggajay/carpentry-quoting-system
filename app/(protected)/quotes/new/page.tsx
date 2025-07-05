'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineItemRow } from '@/components/quote/LineItemRow';
import { Unit, ItemType } from '@prisma/client';
import { LineItem, LineItemUpdate } from '@/types';

const GST_RATE = 0.10; // 10% Australian GST

export default function CreateQuotePage() {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [gstInclusive, setGstInclusive] = useState(true);

  const addLineItem = (type: ItemType = ItemType.CUSTOM) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: Unit.EA,
      unitPrice: 0,
      total: 0,
      itemType: type,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, updates: LineItemUpdate) => {
    setLineItems(items =>
      items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = gstInclusive ? subtotal - (subtotal / 1.1) : subtotal * GST_RATE;
  const total = gstInclusive ? subtotal : subtotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Your submit logic here
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Create New Quote</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information Section - keep your existing code */}
        
        {/* Line Items Section */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Line Items</h2>
          
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => addLineItem(ItemType.MATERIAL)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + Add Material
            </button>
            <button
              type="button"
              onClick={() => addLineItem(ItemType.LABOR)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              + Add Labor
            </button>
            <button
              type="button"
              onClick={() => addLineItem(ItemType.CUSTOM)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              + Add Custom Item
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="p-2 text-slate-400">Type</th>
                <th className="p-2 text-slate-400">Description</th>
                <th className="p-2 text-slate-400">Qty</th>
                <th className="p-2 text-slate-400">Unit</th>
                <th className="p-2 text-slate-400">Price</th>
                <th className="p-2 text-slate-400">Total</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(item => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  onUpdate={updateLineItem}
                  onRemove={removeLineItem}
                />
              ))}
            </tbody>
          </table>

          {lineItems.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No line items yet. Add materials, labor, or custom items to get started.
            </div>
          )}

          {/* Totals Section */}
          <div className="mt-6 border-t border-slate-700 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between mb-2 text-white">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between mb-2 text-white">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={gstInclusive}
                      onChange={(e) => setGstInclusive(e.target.checked)}
                      className="mr-2"
                    />
                    <span>GST Inclusive</span>
                  </label>
                  <span>${gstAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg border-t border-slate-700 pt-2 text-white">
                  <span>Total {gstInclusive ? '(inc GST)' : '(ex GST)'}:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-slate-700 text-white rounded hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Quote
          </button>
        </div>
      </form>
    </div>
  );
}