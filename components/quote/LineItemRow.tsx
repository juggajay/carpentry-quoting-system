import { useState, useEffect } from 'react';
import { Unit, ItemType } from '@prisma/client';
import { MaterialSelectorPanel } from './MaterialSelectorPanel';
import { LaborRateSelector } from './LaborRateSelector';
import { Material, LaborRate, LineItem, LineItemUpdate } from '@/types';

interface DatabaseLaborRate {
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

interface LineItemRowProps {
  item: LineItem;
  onUpdate: (id: string, updates: LineItemUpdate) => void;
  onRemove: (id: string) => void;
}

export function LineItemRow({ item, onUpdate, onRemove }: LineItemRowProps) {
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showLaborSelector, setShowLaborSelector] = useState(false);
  const [selectedLabor, setSelectedLabor] = useState<DatabaseLaborRate | null>(null);

  // Fetch labor rate details if item has laborRateId
  useEffect(() => {
    const fetchLaborDetails = async () => {
      if (item.laborRateId && item.itemType === ItemType.LABOR) {
        try {
          const res = await fetch(`/api/labor-rates?search=`);
          const data = await res.json();
          const labor = data.find((l: LaborRate) => l.id === item.laborRateId);
          if (labor) {
            setSelectedLabor(labor);
          }
        } catch (error) {
          console.error('Error fetching labor details:', error);
        }
      }
    };

    fetchLaborDetails();
  }, [item.laborRateId, item.itemType]);


  const handleMaterialSelect = (material: Material) => {
    onUpdate(item.id, {
      description: material.name,
      unitPrice: material.pricePerUnit,
      unit: material.unit,
      materialId: material.id,
      total: item.quantity * material.pricePerUnit
    });
  };

  const handleLaborSelect = (labor: DatabaseLaborRate) => {
    setSelectedLabor(labor);
    onUpdate(item.id, {
      description: labor.item_name || labor.activity,
      unitPrice: labor.typical_rate || labor.rate,
      unit: labor.unit as Unit,
      laborRateId: labor.rate_id.toString(),
      total: item.quantity * (labor.typical_rate || labor.rate)
    });
    setShowLaborSelector(false);
  };

  const handleQuantityChange = (quantity: number) => {
    onUpdate(item.id, {
      quantity,
      total: quantity * item.unitPrice
    });
  };

  const handleUnitChange = (unit: Unit) => {
    onUpdate(item.id, { unit });
  };

  const handlePriceChange = (unitPrice: number) => {
    onUpdate(item.id, {
      unitPrice,
      total: item.quantity * unitPrice
    });
  };

  return (
    <>
      <tr className="border-b border-slate-700">
        <td className="p-2">
          <select
            value={item.itemType}
            onChange={(e) => onUpdate(item.id, { itemType: e.target.value as ItemType })}
            className="w-full p-1 border border-gray-700 bg-dark-surface text-white rounded"
          >
            <option value={ItemType.CUSTOM}>Custom</option>
            <option value={ItemType.MATERIAL}>Material</option>
            <option value={ItemType.LABOR}>Labor</option>
          </select>
        </td>
        
        <td className="p-2">
          {item.itemType === ItemType.CUSTOM ? (
            <input
              type="text"
              value={item.description}
              onChange={(e) => onUpdate(item.id, { description: e.target.value })}
              className="w-full p-1 border border-gray-700 bg-dark-surface text-white rounded"
            />
          ) : item.itemType === ItemType.MATERIAL ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={item.description}
                readOnly
                className="flex-1 p-1 border border-gray-700 bg-dark-elevated/50 text-gray-400 rounded cursor-pointer"
                onClick={() => setShowMaterialSelector(true)}
                placeholder="Click to select material..."
              />
              <button
                onClick={() => setShowMaterialSelector(true)}
                className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Browse
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Click Browse to select"
                value={selectedLabor?.item_name || selectedLabor?.activity || item.description || ''}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300"
              />
              <button
                onClick={() => setShowLaborSelector(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Browse
              </button>
            </div>
          )}
        </td>
        
        <td className="p-2 w-24">
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
            className="w-full p-1 border border-gray-700 bg-dark-surface text-white rounded text-right"
            step="0.01"
          />
        </td>
        
        <td className="p-2 w-20">
          <select
            value={item.unit}
            onChange={(e) => handleUnitChange(e.target.value as Unit)}
            className="w-full p-1 border border-gray-700 bg-dark-surface text-white rounded"
          >
            <option value={Unit.EA}>EA</option>
            <option value={Unit.LM}>L/M</option>
            <option value={Unit.SQM}>SQ/M</option>
            <option value={Unit.HR}>HR</option>
            <option value={Unit.DAY}>DAY</option>
            <option value={Unit.PACK}>PACK</option>
          </select>
        </td>
        
        <td className="p-2 w-32">
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
            className="w-full p-1 border border-gray-700 bg-dark-surface text-white rounded text-right"
            step="0.01"
            disabled={item.itemType !== ItemType.CUSTOM}
          />
        </td>
        
        <td className="p-2 w-32 text-right font-medium text-white">
          ${item.total.toFixed(2)}
        </td>
        
        <td className="p-2 w-16">
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </td>
      </tr>
      
      {/* Material Selector Panel */}
      <MaterialSelectorPanel
        isOpen={showMaterialSelector}
        onClose={() => setShowMaterialSelector(false)}
        onSelect={(materials) => {
          if (materials.length > 0) {
            handleMaterialSelect(materials[0]);
            setShowMaterialSelector(false);
          }
        }}
        multiple={false}
      />
      
      {/* Labor Rate Selector */}
      {showLaborSelector && (
        <LaborRateSelector
          onSelect={(labor) => {
            handleLaborSelect(labor);
          }}
          onClose={() => setShowLaborSelector(false)}
        />
      )}
    </>
  );
}