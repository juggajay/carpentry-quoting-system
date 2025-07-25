"use client";

import { useFieldArray, UseFormReturn } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MaterialSelectorPanel } from "@/components/quote/MaterialSelectorPanel";
import { LaborRateSelector } from "@/components/quote/LaborRateSelector";
import { type QuoteFormData } from "./QuoteForm";
import { Material } from "@/types";
import { useState, useEffect } from "react";

interface LineItem {
  type?: "custom" | "material" | "labor";
  materialId?: string;
  laborRateId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface LineItemsManagerProps {
  form: UseFormReturn<QuoteFormData>;
  onLineUpdate: (index: number) => void;
  defaultUnit?: string;
}

function SortableLineItem({
  id,
  index,
  form,
  onRemove,
  onUpdate,
  isMobile,
}: {
  id: string;
  index: number;
  form: UseFormReturn<QuoteFormData>;
  onRemove: () => void;
  onUpdate: () => void;
  isMobile: boolean;
}) {
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showLaborSelector, setShowLaborSelector] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { register, formState: { errors }, watch, setValue } = form;
  
  // Watch current item values
  const currentItem = watch(`items.${index}`);
  const itemType = currentItem?.type || "custom";
  
  // Safely access nested errors
  const itemErrors = errors.items as any;
  const descriptionError = itemErrors?.[index]?.description?.message as string | undefined;
  const quantityError = itemErrors?.[index]?.quantity?.message as string | undefined;
  const unitError = itemErrors?.[index]?.unit?.message as string | undefined;
  const unitPriceError = itemErrors?.[index]?.unitPrice?.message as string | undefined;

  const handleMaterialSelect = (materials: Material[]) => {
    if (materials.length > 0) {
      const material = materials[0];
      setValue(`items.${index}.materialId`, material.id);
      setValue(`items.${index}.description`, material.name);
      setValue(`items.${index}.unitPrice`, material.pricePerUnit);
      setValue(`items.${index}.unit`, material.unit);
      setValue(`items.${index}.total`, currentItem.quantity * material.pricePerUnit);
      onUpdate();
      setShowMaterialSelector(false);
    }
  };

  const handleLaborSelect = (labor: any) => {
    setValue(`items.${index}.laborRateId`, labor.rate_id.toString());
    setValue(`items.${index}.description`, labor.item_name || labor.activity);
    setValue(`items.${index}.unitPrice`, labor.typical_rate || labor.rate);
    setValue(`items.${index}.unit`, labor.unit);
    setValue(`items.${index}.total`, currentItem.quantity * (labor.typical_rate || labor.rate));
    onUpdate();
    setShowLaborSelector(false);
  };

  // Mobile Card Layout
  if (isMobile) {
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          className="mobile-card mb-3"
        >
          {/* Mobile Header with Drag Handle */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded hover:bg-dark-elevated cursor-move touch-none transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                {...attributes}
                {...listeners}
                aria-label={`Reorder item ${index + 1}`}
              >
                <span className="text-muted text-lg">☰</span>
              </button>
              <div className="font-semibold text-white">
                {currentItem?.description || 'New Item'}
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onRemove}
              className="text-slate-400 hover:text-red-500 min-w-[44px] min-h-[44px]"
            >
              <span>🗑</span>
            </Button>
          </div>

          {/* Item Type */}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Type</label>
            <select
              {...register(`items.${index}.type`)}
              className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white focus:border-royal-blue focus:ring-1 focus:ring-royal-blue"
            >
              <option value="custom">Custom</option>
              <option value="material">Material</option>
              <option value="labor">Labor</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            {itemType === "material" ? (
              <button
                type="button"
                onClick={() => setShowMaterialSelector(true)}
                className="w-full px-4 py-3 bg-dark-surface border border-gray-700 rounded-md text-left hover:border-electric-magenta transition-colors"
              >
                <span className={currentItem?.description ? "text-white" : "text-gray-500"}>
                  {currentItem?.description || "Select Material →"}
                </span>
              </button>
            ) : itemType === "labor" ? (
              <button
                type="button"
                onClick={() => setShowLaborSelector(true)}
                className="w-full px-4 py-3 bg-dark-surface border border-gray-700 rounded-md text-left hover:border-electric-magenta transition-colors"
              >
                <span className={currentItem?.description ? "text-white" : "text-gray-500"}>
                  {currentItem?.description || "Select Labor →"}
                </span>
              </button>
            ) : (
              <Input
                placeholder="Enter description"
                {...register(`items.${index}.description`, {
                  required: "Description is required",
                })}
                error={descriptionError}
              />
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Quantity</label>
              <Input
                type="number"
                placeholder="0"
                step="0.01"
                {...register(`items.${index}.quantity`, {
                  required: "Required",
                  valueAsNumber: true,
                  onChange: onUpdate,
                })}
                error={quantityError}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Unit</label>
              <Input
                placeholder="each"
                {...register(`items.${index}.unit`, {
                  required: "Required",
                })}
                error={unitError}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Unit Price</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register(`items.${index}.unitPrice`, {
                  required: "Required",
                  valueAsNumber: true,
                  onChange: onUpdate,
                })}
                error={unitPriceError}
                readOnly={itemType === "material" || itemType === "labor"}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Total</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register(`items.${index}.total`, {
                  valueAsNumber: true,
                })}
                readOnly
                className="bg-dark-elevated/50"
              />
            </div>
          </div>
        </div>

        {/* Material Selector Panel */}
        <MaterialSelectorPanel
          isOpen={showMaterialSelector}
          onClose={() => setShowMaterialSelector(false)}
          onSelect={handleMaterialSelect}
          multiple={false}
        />

        {/* Labor Rate Selector */}
        {showLaborSelector && (
          <LaborRateSelector
            onSelect={handleLaborSelect}
            onClose={() => setShowLaborSelector(false)}
          />
        )}
      </>
    );
  }

  // Desktop Grid Layout
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        grid grid-cols-12 gap-2 items-start p-2 bg-dark-surface rounded-md transition-colors
        ${isDragging ? "opacity-50" : "hover:bg-dark-navy"}
      `}
    >
      {/* Drag Handle */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-dark-elevated cursor-move touch-none transition-colors"
          {...attributes}
          {...listeners}
          aria-label={`Reorder item ${index + 1}`}
        >
          <span className="text-muted">☰</span>
        </button>
      </div>

      {/* Item Type Selection */}
      <div className="col-span-1">
        <select
          {...register(`items.${index}.type`)}
          className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white text-sm focus:border-royal-blue focus:ring-1 focus:ring-royal-blue transition-colors"
        >
          <option value="custom">Custom</option>
          <option value="material">Material</option>
          <option value="labor">Labor</option>
        </select>
      </div>

      {/* Description Field with Material/Labor Browse Button */}
      <div className="col-span-3">
        {itemType === "material" ? (
          <div className="flex gap-2">
            <Input
              placeholder="Click Browse to select material"
              {...register(`items.${index}.description`, {
                required: "Description is required",
              })}
              error={descriptionError}
              readOnly
              className="cursor-pointer"
              onClick={() => setShowMaterialSelector(true)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowMaterialSelector(true)}
              className="px-3 whitespace-nowrap"
            >
              Browse
            </Button>
          </div>
        ) : itemType === "labor" ? (
          <div className="flex gap-2">
            <Input
              placeholder="Click Browse to select labor rate"
              {...register(`items.${index}.description`, {
                required: "Description is required",
              })}
              error={descriptionError}
              readOnly
              className="cursor-pointer"
              onClick={() => setShowLaborSelector(true)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowLaborSelector(true)}
              className="px-3 whitespace-nowrap"
            >
              Browse
            </Button>
          </div>
        ) : (
          <Input
            placeholder="Description"
            {...register(`items.${index}.description`, {
              required: "Description is required",
            })}
            error={descriptionError}
          />
        )}
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Qty"
          step="0.01"
          {...register(`items.${index}.quantity`, {
            required: "Required",
            valueAsNumber: true,
            onChange: onUpdate,
          })}
          error={quantityError}
        />
      </div>
      <div className="col-span-1">
        <Input
          placeholder="Unit"
          {...register(`items.${index}.unit`, {
            required: "Required",
          })}
          error={unitError}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Price"
          step="0.01"
          {...register(`items.${index}.unitPrice`, {
            required: "Required",
            valueAsNumber: true,
            onChange: onUpdate,
          })}
          error={unitPriceError}
          readOnly={itemType === "material" || itemType === "labor"}
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Total"
          step="0.01"
          {...register(`items.${index}.total`, {
            valueAsNumber: true,
          })}
          readOnly
          className="bg-dark-elevated/50"
        />
      </div>
      <div className="col-span-1 flex items-center justify-center pt-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500"
        >
          <span>🗑</span>
        </Button>
      </div>

      {/* Material Selector Panel */}
      <MaterialSelectorPanel
        isOpen={showMaterialSelector}
        onClose={() => setShowMaterialSelector(false)}
        onSelect={handleMaterialSelect}
        multiple={false}
      />

      {/* Labor Rate Selector */}
      {showLaborSelector && (
        <LaborRateSelector
          onSelect={handleLaborSelect}
          onClose={() => setShowLaborSelector(false)}
        />
      )}
    </div>
  );
}

export default function LineItemsManager({
  form,
  onLineUpdate,
  defaultUnit = "EA",
}: LineItemsManagerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      
      move(oldIndex, newIndex);
    }
  };

  const addNewItem = () => {
    append({
      type: "custom",
      description: "",
      quantity: 1,
      unit: defaultUnit,
      unitPrice: 0,
      total: 0,
    });
  };

  return (
    <div className="bg-dark-elevated rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quote Items</h3>
      
      {/* Desktop Header */}
      <div className="grid grid-cols-12 gap-2 mb-2 px-2 desktop-only">
        <div className="col-span-1"></div>
        <div className="col-span-1 text-xs font-medium text-gray-400">Type</div>
        <div className="col-span-3 text-xs font-medium text-gray-400">Description</div>
        <div className="col-span-2 text-xs font-medium text-gray-400">Quantity</div>
        <div className="col-span-1 text-xs font-medium text-gray-400">Unit</div>
        <div className="col-span-2 text-xs font-medium text-gray-400">Unit Price</div>
        <div className="col-span-1 text-xs font-medium text-gray-400">Total</div>
        <div className="col-span-1"></div>
      </div>

      {/* Draggable Items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, index) => (
              <SortableLineItem
                key={field.id}
                id={field.id}
                index={index}
                form={form}
                onRemove={() => remove(index)}
                onUpdate={() => onLineUpdate(index)}
                isMobile={isMobile}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Item Button */}
      <div className={`mt-4 ${isMobile ? '' : 'pt-4 border-t border-gray-700'}`}>
        <Button
          type="button"
          variant="secondary"
          onClick={addNewItem}
          className="w-full hover:bg-dark-surface min-h-[44px]"
        >
          <span className="mr-2">+</span>
          Add Line Item
        </Button>
      </div>

      {/* Mobile Quick Add Button */}
      {isMobile && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            type="button"
            onClick={addNewItem}
            className="w-14 h-14 bg-electric-magenta text-white rounded-full shadow-lg hover:bg-electric-magenta/90 transition-colors flex items-center justify-center text-2xl font-bold"
            aria-label="Quick add line item"
          >
            +
          </button>
        </div>
      )}

      {/* Instructions for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        To reorder items using keyboard: Tab to focus the drag handle, 
        press Space to pick up, use arrow keys to move, 
        and press Space again to drop.
      </div>
    </div>
  );
}