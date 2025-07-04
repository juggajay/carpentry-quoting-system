"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import LineItemsManager from "./LineItemsManager";
import SaveStatusIndicator from "./SaveStatusIndicator";
import { useAutoSave } from "../hooks/useAutoSave";
import { useQuoteClipboard } from "@/lib/store/quote-clipboard-store";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface QuoteFormData {
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  validUntil: string;
  notes: string;
  termsConditions: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
}

interface QuoteFormProps {
  initialData?: Partial<QuoteFormData>;
  quoteId?: string;
  onSubmit: (data: QuoteFormData) => Promise<void>;
}

export default function QuoteForm({ initialData, quoteId, onSubmit }: QuoteFormProps) {
  const form = useForm<QuoteFormData>({
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      validUntil: "",
      notes: "",
      termsConditions: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit: "each",
          unitPrice: 0,
          total: 0,
        },
      ],
      ...initialData,
    },
  });

  const { watch, setValue } = form;
  const watchedItems = watch("items");
  const { items: clipboardItems, clearItems, getItemCount } = useQuoteClipboard();
  const clipboardCount = getItemCount();

  // Auto-save hook
  const { saveStatus, triggerSave } = useAutoSave({
    data: watch(),
    quoteId,
    enabled: !!quoteId,
  });

  // Calculate totals
  const subtotal = watchedItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + tax;

  // Update line total when quantity or price changes
  const updateLineTotal = (index: number) => {
    const items = watch("items");
    const item = items[index];
    if (item) {
      const newTotal = (item.quantity || 0) * (item.unitPrice || 0);
      setValue(`items.${index}.total`, newTotal);
      triggerSave();
    }
  };

  // Paste clipboard items
  const pasteClipboardItems = () => {
    if (clipboardItems.length === 0) return;

    const currentItems = watch("items");
    const hasEmptyItem = currentItems.length === 1 && 
      !currentItems[0].description && 
      currentItems[0].quantity === 1;

    if (hasEmptyItem) {
      // Replace the empty item
      setValue("items", clipboardItems);
    } else {
      // Append to existing items
      setValue("items", [...currentItems, ...clipboardItems]);
    }

    clearItems();
    toast.success(`${clipboardItems.length} items pasted`);
    triggerSave();
  };

  // Watch for form changes to trigger save
  useEffect(() => {
    const subscription = watch(() => triggerSave());
    return () => subscription.unsubscribe();
  }, [watch, triggerSave]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Save Status */}
      {quoteId && (
        <div className="flex justify-end">
          <SaveStatusIndicator status={saveStatus} />
        </div>
      )}

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Enter client details or select from existing clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Client Name"
              {...form.register("clientName", { required: "Client name is required" })}
              error={form.formState.errors.clientName?.message}
            />
            <Input
              label="Email"
              type="email"
              {...form.register("clientEmail")}
              error={form.formState.errors.clientEmail?.message}
            />
            <Input
              label="Phone"
              type="tel"
              {...form.register("clientPhone")}
              error={form.formState.errors.clientPhone?.message}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Quote Title"
            {...form.register("title", { required: "Title is required" })}
            error={form.formState.errors.title?.message}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              {...form.register("description")}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-background-secondary text-text-primary resize-none focus:outline-none focus:border-primary-light"
            />
          </div>
          <Input
            label="Valid Until"
            type="date"
            {...form.register("validUntil")}
            min={new Date().toISOString().split("T")[0]}
          />
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Add products and services to the quote
              </CardDescription>
            </div>
            {clipboardCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={pasteClipboardItems}
              >
                <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                Paste {clipboardCount} Items
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <LineItemsManager form={form} onLineUpdate={updateLineTotal} />
          
          {/* Totals */}
          <div className="mt-6 pt-6 border-t border-border-default">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal:</span>
                  <span className="text-text-primary font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax (8.25%):</span>
                  <span className="text-text-primary font-medium">
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border-default">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Notes
            </label>
            <textarea
              {...form.register("notes")}
              rows={3}
              placeholder="Internal notes (not shown to client)"
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-background-secondary text-text-primary resize-none focus:outline-none focus:border-primary-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Terms & Conditions
            </label>
            <textarea
              {...form.register("termsConditions")}
              rows={4}
              placeholder="Payment terms, delivery conditions, etc."
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-background-secondary text-text-primary resize-none focus:outline-none focus:border-primary-light"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit">
          {quoteId ? "Update Quote" : "Create Quote"}
        </Button>
      </div>
    </form>
  );
}