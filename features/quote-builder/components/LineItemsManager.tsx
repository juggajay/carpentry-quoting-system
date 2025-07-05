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
import { type QuoteFormData } from "./QuoteForm";
import { Material } from "@/types";
import { useState } from "react";

interface LineItem {
  type?: "custom" | "material" | "labor";
  materialId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface LineItemsManagerProps {
  form: UseFormReturn<QuoteFormData>;
  onLineUpdate: (index: number) => void;
}

function SortableLineItem({
  id,
  index,
  form,
  onRemove,
  onUpdate,
}: {
  id: string;
  index: number;
  form: UseFormReturn<QuoteFormData>;
  onRemove: () => void;
  onUpdate: () => void;
}) {
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        grid grid-cols-12 gap-2 items-start p-2 rounded-lg
        ${isDragging ? "bg-background-hover" : ""}
      `}
    >
      {/* Drag Handle */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-background-hover cursor-move touch-none"
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
          className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
        >
          <option value="custom">Custom</option>
          <option value="material">Material</option>
          <option value="labor">Labor</option>
        </select>
      </div>

      {/* Description Field with Material Browse Button */}
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
          readOnly={itemType === "material"}
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
          className="bg-slate-800/50"
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
    </div>
  );
}

export default function LineItemsManager({
  form,
  onLineUpdate,
}: LineItemsManagerProps) {
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
      unit: "each",
      unitPrice: 0,
      total: 0,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-slate-400 px-2">
        <div className="col-span-1"></div>
        <div className="col-span-1">Type</div>
        <div className="col-span-3">Description</div>
        <div className="col-span-2">Quantity</div>
        <div className="col-span-1">Unit</div>
        <div className="col-span-2">Unit Price</div>
        <div className="col-span-1">Total</div>
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Item Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={addNewItem}
        className="w-full"
      >
        <span className="mr-2">+</span>
        Add Line Item
      </Button>

      {/* Instructions for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        To reorder items using keyboard: Tab to focus the drag handle, 
        press Space to pick up, use arrow keys to move, 
        and press Space again to drop.
      </div>
    </div>
  );
}