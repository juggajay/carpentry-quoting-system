"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface ProjectDetailsForm {
  // Company fields
  companyName?: string;
  abn?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  
  // Client fields
  clientName: string;  // Only this is required
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  siteAddress?: string;
  
  // Project details
  quoteNumber?: string;
  quoteDate?: string;
  validUntil?: string;
  projectType?: string;
  projectTitle?: string;
  projectDescription?: string;
  specialNotes?: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const form = useForm<ProjectDetailsForm>({
    mode: "onChange", // This will show validation errors as user types
    defaultValues: {
      // Company fields
      companyName: "",
      abn: "",
      companyPhone: "",
      companyEmail: "",
      companyAddress: "",
      // Client fields  
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      siteAddress: "",
      // Project details
      quoteNumber: "", // Will be generated server-side
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectType: "",
      projectTitle: "",
      projectDescription: "",
      specialNotes: "",
    }
  });

  useEffect(() => {
    // Load settings from database
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/quote-defaults');
        if (response.ok) {
          const settings = await response.json();
          if (settings) {
            // Update form with company details from settings
            form.setValue('companyName', settings.companyName || '');
            form.setValue('abn', settings.abn || '');
            form.setValue('companyPhone', settings.companyPhone || '');
            form.setValue('companyEmail', settings.companyEmail || '');
            form.setValue('companyAddress', settings.companyAddress || '');
            
            // Update validity date based on defaultValidityDays
            if (settings.defaultValidityDays) {
              const validUntilDate = new Date(Date.now() + settings.defaultValidityDays * 24 * 60 * 60 * 1000);
              form.setValue('validUntil', validUntilDate.toISOString().split('T')[0]);
            }
            
            // Store default notes for later use
            form.setValue('specialNotes', settings.defaultNotes || '');
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, [form]);

  const handleContinue = form.handleSubmit(async (data) => {
    console.log('Step 1 - Form submitted:', data);
    setIsSubmitting(true);
    
    try {
      // Save to session storage
      sessionStorage.setItem('quoteProjectDetails', JSON.stringify(data));
      console.log('Step 1 - Data saved to sessionStorage');
      
      // Navigate to line items page
      router.push('/quotes/new/items');
      console.log('Step 1 - Navigating to items page');
    } catch (error) {
      console.error('Step 1 - Error:', error);
      setIsSubmitting(false);
    }
  }, (errors) => {
    console.log('Step 1 - Form validation errors:', errors);
    console.log('Step 1 - Error details:', Object.entries(errors).map(([field, error]) => ({
      field,
      message: error?.message || 'Unknown error'
    })));
    setIsSubmitting(false);
  });

  if (isLoadingSettings) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-magenta mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create New Quote - Step 1</h1>
        <p className="text-muted-foreground">
          Enter project and client details
        </p>
        
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg text-sm">
            <p className="text-slate-400 mb-2">Debug Info:</p>
            <p className="text-white">Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</p>
            <p className="text-white">Is Validating: {form.formState.isValidating ? 'Yes' : 'No'}</p>
            <p className="text-white">Is Submitting: {form.formState.isSubmitting ? 'Yes' : 'No'}</p>
            <p className="text-white">Errors: {Object.keys(form.formState.errors).length}</p>
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="mt-2">
                <p className="text-red-400 mb-1">Validation Errors:</p>
                {Object.entries(form.formState.errors).map(([field, error]) => (
                  <p key={field} className="text-red-300 text-xs">
                    • {field}: {error?.message || 'Required'}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleContinue} className="space-y-6">
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

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Basic information about the project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Quote Number"
                value="Auto-generated"
                readOnly
                className="bg-dark-elevated/50 text-gray-400"
                title="Quote number will be generated when you create the quote"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Project Type
              </label>
              <select
                {...form.register("projectType")}
                className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-royal-blue focus:ring-offset-2 focus:ring-offset-dark-surface focus:border-royal-blue hover:border-gray-600 transition-all duration-200"
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

            <Input
              label="Project Title"
              {...form.register("projectTitle")}
              placeholder="e.g., Master Bedroom Extension"
            />

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Project Description
              </label>
              <textarea
                {...form.register("projectDescription")}
                rows={4}
                className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-royal-blue focus:ring-offset-2 focus:ring-offset-dark-surface focus:border-royal-blue hover:border-gray-600 transition-all duration-200"
                placeholder="Describe the work to be done..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Special Notes (Optional)
              </label>
              <textarea
                {...form.register("specialNotes")}
                rows={3}
                className="w-full px-3 py-2 bg-dark-surface border border-gray-700 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-royal-blue focus:ring-offset-2 focus:ring-offset-dark-surface focus:border-royal-blue hover:border-gray-600 transition-all duration-200"
                placeholder="Any special conditions, access requirements, etc..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={() => router.push('/quotes')}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {/* Temporary bypass button for testing */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  console.log('Bypassing validation for testing');
                  const formData = form.getValues();
                  sessionStorage.setItem('quoteProjectDetails', JSON.stringify(formData));
                  router.push('/quotes/new/items');
                }}
              >
                Skip Validation (Dev)
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Continue to Line Items →'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}