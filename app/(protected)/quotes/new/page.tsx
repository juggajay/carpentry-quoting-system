"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface ProjectDetailsForm {
  // Company fields
  companyName: string;
  abn: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  
  // Client fields
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  siteAddress?: string;
  
  // Project details
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  projectType: string;
  projectTitle: string;
  projectDescription: string;
  specialNotes?: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const form = useForm<ProjectDetailsForm>({
    defaultValues: {
      quoteNumber: `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  });

  const handleContinue = form.handleSubmit(async (data) => {
    // Save to session storage
    sessionStorage.setItem('quoteProjectDetails', JSON.stringify(data));
    
    // Navigate to line items page
    router.push('/quotes/new/items');
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create New Quote - Step 1</h1>
        <p className="text-muted-foreground">
          Enter project and client details
        </p>
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
            </div>

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

            <Input
              label="Project Title"
              {...form.register("projectTitle")}
              placeholder="e.g., Master Bedroom Extension"
            />

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Project Description
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
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={() => router.push('/quotes')}>
            Cancel
          </Button>
          <Button type="submit">
            Continue to Line Items →
          </Button>
        </div>
      </form>
    </div>
  );
}