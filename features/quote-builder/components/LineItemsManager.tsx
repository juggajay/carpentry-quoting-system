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
import { 
  TrashIcon, 
  PlusIcon, 
  Bars3Icon 
} from "@heroicons/react/24/outline";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface LineItemsManagerProps {
  form: UseFormReturn<any>;
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
  form: UseFormReturn<any>;
  onRemove: () => void;
  onUpdate: () => void;
}) {
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

  const { register, formState: { errors } } = form;

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
          <Bars3Icon className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Form Fields */}
      <div className="col-span-4">
        <Input
          placeholder="Description"
          {...register(`items.${index}.description`, {
            required: "Description is required",
          })}
          error={errors.items?.[index]?.description?.message}
        />
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
          error={errors.items?.[index]?.quantity?.message}
        />
      </div>
      <div className="col-span-1">
        <Input
          placeholder="Unit"
          {...register(`items.${index}.unit`, {
            required: "Required",
          })}
          error={errors.items?.[index]?.unit?.message}
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
          error={errors.items?.[index]?.unitPrice?.message}
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
          className="bg-background-secondary/50"
        />
      </div>
      <div className="col-span-1 flex items-center justify-center pt-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="text-text-muted hover:text-error"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
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
      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-text-secondary px-2">
        <div className="col-span-1"></div>
        <div className="col-span-4">Description</div>
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
        <PlusIcon className="w-4 h-4 mr-2" />
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