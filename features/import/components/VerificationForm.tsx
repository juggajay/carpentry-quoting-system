"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface VerificationFormProps {
  initialItems: LineItem[];
  onHighlight: (area: { x: number; y: number; width: number; height: number; label: string } | null) => void;
  onSave: (items: LineItem[], clientInfo: any) => Promise<void>;
}

export default function VerificationForm({
  initialItems,
  onHighlight,
  onSave,
}: VerificationFormProps) {
  const [saving, setSaving] = useState(false);
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      items: initialItems,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + tax;

  // Handle field focus for highlighting
  const handleFieldFocus = (index: number, field: string) => {
    // Simulate highlight areas based on field position
    // In a real implementation, these would be extracted from OCR coordinates
    const baseY = 40 + (index * 5);
    const highlights: Record<string, any> = {
      description: { x: 10, y: baseY, width: 40, height: 4 },
      quantity: { x: 50, y: baseY, width: 10, height: 4 },
      unit: { x: 60, y: baseY, width: 10, height: 4 },
      unitPrice: { x: 70, y: baseY, width: 15, height: 4 },
      total: { x: 85, y: baseY, width: 15, height: 4 },
    };

    const area = highlights[field];
    if (area) {
      onHighlight({ ...area, label: `Item ${index + 1} - ${field}` });
    }
  };

  const handleFieldBlur = () => {
    onHighlight(null);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      await onSave(data.items, {
        name: data.clientName,
        email: data.clientEmail,
        phone: data.clientPhone,
      });
      toast.success("Quote imported successfully!");
    } catch (error) {
      toast.error("Failed to save quote. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Auto-calculate line totals
  const updateLineTotal = (index: number) => {
    const item = watchedItems[index];
    if (item) {
      const newTotal = (item.quantity || 0) * (item.unitPrice || 0);
      if (newTotal !== item.total) {
        update(index, { ...item, total: newTotal });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Client Name"
              {...register("clientName", { required: "Client name is required" })}
              error={errors.clientName?.message}
              onFocus={() => onHighlight({ x: 10, y: 20, width: 30, height: 5, label: "Client Name" })}
              onBlur={handleFieldBlur}
            />
            <Input
              label="Email"
              type="email"
              {...register("clientEmail")}
              onFocus={() => onHighlight({ x: 10, y: 25, width: 30, height: 5, label: "Email" })}
              onBlur={handleFieldBlur}
            />
            <Input
              label="Phone"
              type="tel"
              {...register("clientPhone")}
              onFocus={() => onHighlight({ x: 10, y: 30, width: 30, height: 5, label: "Phone" })}
              onBlur={handleFieldBlur}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Line Items
            </h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unit: "each",
                  unitPrice: 0,
                  total: 0,
                })
              }
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-start"
              >
                <div className="col-span-4">
                  <Input
                    placeholder="Description"
                    {...register(`items.${index}.description` as const, {
                      required: "Description is required",
                    })}
                    error={errors.items?.[index]?.description?.message}
                    onFocus={() => handleFieldFocus(index, "description")}
                    onBlur={handleFieldBlur}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    step="0.01"
                    {...register(`items.${index}.quantity` as const, {
                      required: "Required",
                      valueAsNumber: true,
                      onChange: () => updateLineTotal(index),
                    })}
                    error={errors.items?.[index]?.quantity?.message}
                    onFocus={() => handleFieldFocus(index, "quantity")}
                    onBlur={handleFieldBlur}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="Unit"
                    {...register(`items.${index}.unit` as const, {
                      required: "Required",
                    })}
                    error={errors.items?.[index]?.unit?.message}
                    onFocus={() => handleFieldFocus(index, "unit")}
                    onBlur={handleFieldBlur}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    {...register(`items.${index}.unitPrice` as const, {
                      required: "Required",
                      valueAsNumber: true,
                      onChange: () => updateLineTotal(index),
                    })}
                    error={errors.items?.[index]?.unitPrice?.message}
                    onFocus={() => handleFieldFocus(index, "unitPrice")}
                    onBlur={handleFieldBlur}
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    placeholder="Total"
                    step="0.01"
                    {...register(`items.${index}.total` as const, {
                      valueAsNumber: true,
                    })}
                    readOnly
                    className="bg-background-secondary/50"
                    onFocus={() => handleFieldFocus(index, "total")}
                    onBlur={handleFieldBlur}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                    className="text-text-muted hover:text-error"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-6 border-t border-border-default">
            <div className="flex justify-end space-y-1 text-sm">
              <div className="w-48">
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">Subtotal:</span>
                  <span className="text-text-primary font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">Tax (8.25%):</span>
                  <span className="text-text-primary font-medium">
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-border-default">
                  <span className="text-text-primary font-semibold">Total:</span>
                  <span className="text-text-primary font-semibold text-lg">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Save & Import
        </Button>
      </div>
    </form>
  );
}