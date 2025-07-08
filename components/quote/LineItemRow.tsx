import { useState, useEffect } from 'react';
import { Unit, ItemType } from '@prisma/client';
import { MaterialSelectorPanel } from './MaterialSelectorPanel';
import { LaborRateSelector } from './LaborRateSelector';
import { LineItemCard } from './LineItemCard';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showLaborSelector, setShowLaborSelector] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedLabor, setSelectedLabor] = useState<DatabaseLaborRate | null>(null);
  const [description, setDescription] = useState(item.description);

  // Fetch material details if item has materialId
  useEffect(() => {
    const fetchMaterialDetails = async () => {
      if (item.materialId && item.itemType === ItemType.MATERIAL) {
        try {
          const res = await fetch(`/api/materials?search=`);
          const data = await res.json();
          const material = data.find((m: Material) => m.id === item.materialId);
          if (material) {
            setSelectedMaterial(material);
          }
        } catch (error) {
          console.error('Error fetching material details:', error);
        }
      }
    };

    fetchMaterialDetails();
  }, [item.materialId, item.itemType]);

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
    setSelectedMaterial(material);
    onUpdate(item.id, {
      description: material.name,
      unitPrice: material.pricePerUnit,
      unit: material.unit,
      materialId: material.id,
      total: item.quantity * material.pricePerUnit
    });
    setShowMaterialSelector(false);
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

  const handleDescriptionChange = (description: string) => {
    setDescription(description);
    onUpdate(item.id, { description });
  };

  const renderDescriptionField = () => {
    switch (item.itemType) {
      case ItemType.MATERIAL:
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Click Browse to select"
              value={selectedMaterial?.name || item.description || ''}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300"
            />
            <button
              onClick={() => setShowMaterialSelector(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse
            </button>
          </div>
        );
      
      case ItemType.LABOR:
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Click Browse to select"
              value={selectedLabor?.item_name || item.description || ''}
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
        );
      
      default:
        return (
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
          />
        );
    }
  };

  // Mobile view uses LineItemCard
  if (isMobile) {
    const mobileItem = {
      ...item,
      material: selectedMaterial ? {
        name: selectedMaterial.name,
        pricePerUnit: selectedMaterial.pricePerUnit,
        unit: selectedMaterial.unit as string
      } : undefined,
      laborRate: selectedLabor ? {
        item_name: selectedLabor.item_name || selectedLabor.activity,
        rate: selectedLabor.typical_rate || selectedLabor.rate,
        unit: selectedLabor.unit as string
      } : undefined,
      laborPrice: selectedLabor ? (selectedLabor.typical_rate || selectedLabor.rate) : 0
    };

    return (
      <>
        <LineItemCard
          item={mobileItem}
          onUpdate={(field, value) => {
            if (field === 'quantity') {
              handleQuantityChange(value as number);
            } else if (field === 'unit') {
              handleUnitChange(value as Unit);
            } else if (field === 'description') {
              handleDescriptionChange(value as string);
            } else if (field === 'unitPrice') {
              handlePriceChange(value as number);
            } else if (field === 'notes') {
              // Notes field doesn't exist in the LineItem type, so we skip it
              return;
            } else {
              onUpdate(item.id, { [field]: value });
            }
          }}
          onDelete={() => onRemove(item.id)}
          onSelectMaterial={() => setShowMaterialSelector(true)}
          onSelectLabor={() => setShowLaborSelector(true)}
          index={0}
        />
        
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

  // Desktop view - original table row
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
          {renderDescriptionField()}
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