"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import LineItemsManager from "./LineItemsManager";
import { useQuoteClipboard } from "@/lib/store/quote-clipboard-store";
import { toast } from "sonner";

export interface QuoteFormData {
  // Company fields
  companyName?: string;
  abn?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  
  // Client fields
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: string;
  siteAddress?: string;
  
  // Quote details
  quoteNumber?: string;
  quoteDate?: string;
  projectType?: string;
  projectTitle?: string;
  projectDescription?: string;
  specialNotes?: string;
  
  // Terms
  paymentTerms?: string;
  paymentSchedule?: string;
  warrantyPeriod?: string;
  additionalTerms?: string;
  
  // Existing fields
  title: string;
  description: string;
  validUntil: string;
  notes: string;
  termsConditions: string;
  items: Array<{
    type?: "custom" | "material" | "labor";
    materialId?: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
}

export interface QuoteFormProps {
  initialData?: Partial<QuoteFormData>;
  quoteId?: string;
  onSubmit: (data: QuoteFormData) => Promise<void>;
}

export default function QuoteForm({ initialData, quoteId, onSubmit }: QuoteFormProps) {
  const form = useForm<QuoteFormData>({
    defaultValues: {
      // Company fields
      companyName: "",
      abn: "",
      companyPhone: "",
      companyEmail: "",
      companyAddress: "",
      // Client fields
      clientId: "",
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      siteAddress: "",
      // Quote details
      quoteNumber: "", // Will be generated server-side
      quoteDate: new Date().toISOString().split('T')[0],
      projectType: "",
      projectTitle: "",
      projectDescription: "",
      specialNotes: "",
      // Terms
      paymentTerms: "7 days from invoice",
      paymentSchedule: "10% deposit upon acceptance\n50% on commencement of work\n40% on completion",
      warrantyPeriod: "6 months on workmanship",
      additionalTerms: "All work carried out to Australian Standards.\nVariations must be agreed in writing.\nQuote valid for 30 days.",
      // Existing fields
      title: "",
      description: "",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  // Calculate totals
  const subtotal = watchedItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const tax = subtotal * 0.10; // 10% GST for Australia
  const total = subtotal + tax;
  const deposit = total * 0.10; // 10% deposit

  // Update line total when quantity or price changes
  const updateLineTotal = (index: number) => {
    const items = watch("items");
    const item = items[index];
    if (item) {
      const newTotal = (item.quantity || 0) * (item.unitPrice || 0);
      setValue(`items.${index}.total`, newTotal);
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
  };


  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Business Details</CardTitle>
          <CardDescription>
            This information will appear on the quote
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            {...form.register("companyName")}
            placeholder="Your business name"
          />
          <Input
            label="ABN"
            {...form.register("abn")}
            placeholder="12345678901"
          />
          <Input
            label="Phone"
            {...form.register("companyPhone")}
            placeholder="0400 123 456"
          />
          <Input
            label="Email"
            type="email"
            {...form.register("companyEmail")}
            placeholder="info@yourbusiness.com.au"
          />
          <div className="md:col-span-2">
            <Input
              label="Business Address"
              {...form.register("companyAddress")}
              placeholder="123 Main St, Sydney NSW 2000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Who is this quote for?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Client Name *"
            {...form.register("clientName", { required: "Client name is required" })}
            error={form.formState.errors.clientName?.message}
          />
          <Input
            label="Client Company"
            {...form.register("clientCompany")}
            placeholder="Optional"
          />
          <Input
            label="Phone"
            {...form.register("clientPhone")}
            placeholder="0400 123 456"
          />
          <Input
            label="Email"
            type="email"
            {...form.register("clientEmail")}
            placeholder="client@email.com"
          />
          <div className="md:col-span-2">
            <Input
              label="Client Address"
              {...form.register("clientAddress")}
              placeholder="Client's address"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Site Address (if different)"
              {...form.register("siteAddress")}
              placeholder="Leave blank if same as client address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
          <CardDescription>
            Basic information about this quote
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Quote Number"
            {...form.register("quoteNumber")}
            readOnly
          />
          <Input
            label="Quote Date"
            type="date"
            {...form.register("quoteDate")}
          />
          <Input
            label="Valid Until"
            type="date"
            {...form.register("validUntil")}
          />
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Project Type
            </label>
            <select
              {...form.register("projectType")}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-green-600 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200"
            >
              <option value="">Select type...</option>
              <option value="new_build">New Build</option>
              <option value="renovation">Renovation</option>
              <option value="extension">Extension</option>
              <option value="repair">Repair</option>
              <option value="deck">Deck/Outdoor</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Project Description */}
      <Card>
        <CardHeader>
          <CardTitle>Project Description</CardTitle>
          <CardDescription>
            What work will be done?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Project Title"
              {...form.register("projectTitle")}
              placeholder="e.g., Master Bedroom Extension"
            />
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Description
              </label>
              <textarea
                {...form.register("projectDescription")}
                rows={4}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-green-600 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200"
                placeholder="Describe the work to be done..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Special Notes (Optional)
              </label>
              <textarea
                {...form.register("specialNotes")}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-green-600 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200"
                placeholder="Any special conditions, access requirements, etc..."
              />
            </div>
          </div>
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
                Paste {clipboardCount} Items
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <LineItemsManager form={form} onLineUpdate={updateLineTotal} />
          
          {/* Totals */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex justify-end">
              <div className="w-96 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">GST (10%):</span>
                  <span className="text-white">
                    ${tax.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-slate-700">
                  <span>Total (inc GST):</span>
                  <span className="text-green-500">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Add deposit line */}
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-slate-400">Deposit (10%):</span>
                  <span className="text-white font-medium">
                    ${deposit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Payment Terms"
                {...form.register("paymentTerms")}
                placeholder="e.g., 7 days from invoice"
              />
              <Input
                label="Warranty Period"
                {...form.register("warrantyPeriod")}
                placeholder="e.g., 6 months"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Payment Schedule
              </label>
              <textarea
                {...form.register("paymentSchedule")}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-green-600 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200"
                placeholder="e.g., 10% deposit, 50% on commencement, 40% on completion"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Additional Terms
              </label>
              <textarea
                {...form.register("additionalTerms")}
                rows={4}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-green-600 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200"
                placeholder="Any additional terms and conditions..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
          <CardDescription>
            Notes for your reference (not shown to client)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            {...form.register("notes")}
            rows={3}
            placeholder="Any internal notes about this quote..."
            className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-slate-950 focus:border-green-600 hover:border-slate-700 hover:bg-slate-800 transition-all duration-200"
          />
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