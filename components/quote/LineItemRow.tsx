import { useState, useEffect, useCallback } from 'react';
import { Unit, ItemType } from '@prisma/client';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { MaterialSelectorPanel } from './MaterialSelectorPanel';
import { Material, LaborRate, LineItem, LineItemUpdate } from '@/types';

interface LineItemRowProps {
  item: LineItem;
  onUpdate: (id: string, updates: LineItemUpdate) => void;
  onRemove: (id: string) => void;
}

export function LineItemRow({ item, onUpdate, onRemove }: LineItemRowProps) {
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);

  const fetchOptions = useCallback(async () => {
    if (item.itemType === ItemType.LABOR) {
      const res = await fetch(`/api/labor-rates?search=${searchTerm}`);
      const data = await res.json();
      setLaborRates(data);
    }
  }, [item.itemType, searchTerm]);

  // Fetch materials/labor when searching
  useEffect(() => {
    if (searchTerm.length > 2) {
      fetchOptions();
    }
  }, [searchTerm, fetchOptions]);


  const handleMaterialSelect = (material: Material) => {
    onUpdate(item.id, {
      description: material.name,
      unitPrice: material.pricePerUnit,
      unit: material.unit,
      materialId: material.id,
      total: item.quantity * material.pricePerUnit
    });
  };

  const handleLaborSelect = (labor: LaborRate) => {
    onUpdate(item.id, {
      description: `${labor.title} ${labor.level || ''}`.trim(),
      unitPrice: labor.loadedRate,
      unit: Unit.HR,
      laborRateId: labor.id,
      total: item.quantity * labor.loadedRate
    });
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
            <SearchableDropdown
              value={item.description}
              onSearch={setSearchTerm}
              options={laborRates}
              onSelect={(option) => {
                if ('title' in option) {
                  handleLaborSelect(option);
                }
              }}
              placeholder="Search labor rates..."
            />
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
    </>
  );
}