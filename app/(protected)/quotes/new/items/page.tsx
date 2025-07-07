"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import LineItemsManager from "@/features/quote-builder/components/LineItemsManager";
import { createQuote } from "@/features/quote-builder/actions";
import { toast } from "sonner";

interface QuoteFormData {
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

interface ProjectDetails {
  companyName: string;
  abn: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  siteAddress?: string;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  projectType: string;
  projectTitle: string;
  projectDescription: string;
  specialNotes?: string;
}

export default function QuoteItemsPage() {
  const router = useRouter();
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<QuoteFormData>({
    defaultValues: {
      // Required fields with defaults
      clientId: "",
      title: "",
      description: "",
      validUntil: "",
      notes: "",
      termsConditions: "",
      items: [{
        type: "custom",
        description: "",
        quantity: 1,
        unit: "each",
        unitPrice: 0,
        total: 0,
      }],
      paymentTerms: "7 days from invoice",
      warrantyPeriod: "6 months on workmanship",
      paymentSchedule: "10% deposit upon acceptance\n50% on commencement of work\n40% on completion",
    }
  });

  // Load project details from previous step
  useEffect(() => {
    const savedDetails = sessionStorage.getItem('quoteProjectDetails');
    if (!savedDetails) {
      toast.error("No project details found. Please start from the beginning.");
      router.push('/quotes/new');
      return;
    }
    
    const details = JSON.parse(savedDetails);
    setProjectDetails(details);
    
    // Merge with form data and set required fields
    Object.keys(details).forEach(key => {
      form.setValue(key as keyof QuoteFormData, details[key]);
    });
    
    // Set required fields based on project details
    form.setValue('title', details.projectTitle || 'Untitled Quote');
    form.setValue('description', details.projectDescription || '');
    form.setValue('validUntil', details.validUntil || '');
    form.setValue('clientId', ''); // Will be set when creating the quote
    
    setLoading(false);
  }, [form, router]);

  const watchedItems = form.watch("items");
  const subtotal = watchedItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const gst = subtotal * 0.1;
  const total = subtotal + gst;
  const deposit = total * 0.1;

  const updateLineTotal = (index: number) => {
    const items = form.watch("items");
    const item = items[index];
    if (item) {
      const newTotal = (item.quantity || 0) * (item.unitPrice || 0);
      form.setValue(`items.${index}.total`, newTotal);
    }
  };

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    const result = await createQuote({ ...formData, status: 'DRAFT' });
    
    if (result.success) {
      sessionStorage.removeItem('quoteProjectDetails');
      toast.success("Draft saved successfully!");
      router.push(`/quotes/${result.quoteId}`);
    } else {
      toast.error(result.error || "Failed to save draft");
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    console.log('1. Form submitted:', data);
    
    const result = await createQuote(data);
    console.log('2. Create quote result:', result);
    
    if (result.success) {
      sessionStorage.removeItem('quoteProjectDetails');
      toast.success("Quote created successfully!");
      console.log('3. Navigating to:', `/quotes/${result.quoteId}`);
      router.push(`/quotes/${result.quoteId}`);
    } else {
      console.error('3. Error:', result.error);
      toast.error(result.error || "Failed to create quote");
    }
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-elevated rounded w-1/3"></div>
          <div className="h-4 bg-dark-elevated rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            <div className="h-48 bg-dark-elevated rounded"></div>
            <div className="h-96 bg-dark-elevated rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!projectDetails) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create New Quote - Step 2</h1>
        <p className="text-muted-foreground">
          Add materials, labor, and other line items
        </p>
      </div>

      {/* Project Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
          <CardDescription>
            {projectDetails.projectTitle || 'Untitled Project'} for {projectDetails.clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Quote #:</span>
              <span className="ml-2 text-white">{projectDetails.quoteNumber || 'Auto-generated'}</span>
            </div>
            <div>
              <span className="text-slate-400">Date:</span>
              <span className="ml-2 text-white">{projectDetails.quoteDate}</span>
            </div>
            <div>
              <span className="text-slate-400">Valid Until:</span>
              <span className="ml-2 text-white">{projectDetails.validUntil}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>
              Add materials, labor, and custom items to the quote
            </CardDescription>
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
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">GST (10%):</span>
                    <span className="text-white">
                      ${gst.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-slate-700">
                    <span>Total (inc GST):</span>
                    <span className="text-vibrant-cyan">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm pt-2">
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

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-royal-blue focus:ring-offset-2 focus:ring-offset-dark-surface focus:border-royal-blue hover:border-gray-600 hover:bg-dark-elevated transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => router.push('/quotes/new')}
          >
            ← Back to Details
          </Button>
          <div className="space-x-4">
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
            <Button type="submit">
              Create Quote
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}