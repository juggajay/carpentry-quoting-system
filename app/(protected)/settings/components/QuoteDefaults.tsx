"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FormData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  abn: string;
  defaultTaxRate: number;
  defaultValidityDays: number;
  defaultTermsConditions: string;
  defaultNotes: string;
  defaultUnit: string;
  saturdayRateMultiplier: number;
  sundayRateMultiplier: number;
}

export default function QuoteDefaults() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    abn: "",
    defaultTaxRate: 10,
    defaultValidityDays: 30,
    defaultTermsConditions: "",
    defaultNotes: "",
    defaultUnit: "EA",
    saturdayRateMultiplier: 1.5,
    sundayRateMultiplier: 2.0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/quote-defaults");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFormData(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/quote-defaults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Quote default settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-electric-magenta" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Company Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Your Company Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abn">ABN</Label>
            <Input
              id="abn"
              value={formData.abn}
              onChange={(e) => handleChange("abn", e.target.value)}
              placeholder="12345678901"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone">Phone</Label>
            <Input
              id="companyPhone"
              value={formData.companyPhone}
              onChange={(e) => handleChange("companyPhone", e.target.value)}
              placeholder="+61 400 000 000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail">Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={(e) => handleChange("companyEmail", e.target.value)}
              placeholder="info@company.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAddress">Address</Label>
          <textarea
            id="companyAddress"
            value={formData.companyAddress}
            onChange={(e) => handleChange("companyAddress", e.target.value)}
            placeholder="123 Main St, City, State 1234"
            className="w-full min-h-[80px] px-3 py-2 bg-dark-elevated border border-dark-border rounded-md text-white placeholder-dark-text-secondary focus:border-electric-magenta focus:outline-none focus:ring-1 focus:ring-electric-magenta"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Quote Defaults</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
            <Input
              id="defaultTaxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.defaultTaxRate}
              onChange={(e) => handleChange("defaultTaxRate", parseFloat(e.target.value))}
            />
            <p className="text-sm text-dark-text-secondary">GST or tax percentage</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultValidityDays">Quote Validity (days)</Label>
            <Input
              id="defaultValidityDays"
              type="number"
              min="1"
              max="365"
              value={formData.defaultValidityDays}
              onChange={(e) => handleChange("defaultValidityDays", parseInt(e.target.value))}
            />
            <p className="text-sm text-dark-text-secondary">Days until quote expires</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultUnit">Default Unit</Label>
            <Select value={formData.defaultUnit} onValueChange={(value) => handleChange("defaultUnit", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EA">Each (EA)</SelectItem>
                <SelectItem value="M">Meter (M)</SelectItem>
                <SelectItem value="M2">Square Meter (M²)</SelectItem>
                <SelectItem value="M3">Cubic Meter (M³)</SelectItem>
                <SelectItem value="LM">Linear Meter (LM)</SelectItem>
                <SelectItem value="L">Liter (L)</SelectItem>
                <SelectItem value="KG">Kilogram (KG)</SelectItem>
                <SelectItem value="HOUR">Hour</SelectItem>
                <SelectItem value="DAY">Day</SelectItem>
                <SelectItem value="WEEK">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultTermsConditions">Default Terms & Conditions</Label>
          <textarea
            id="defaultTermsConditions"
            value={formData.defaultTermsConditions}
            onChange={(e) => handleChange("defaultTermsConditions", e.target.value)}
            placeholder="Enter your standard terms and conditions..."
            className="w-full min-h-[120px] px-3 py-2 bg-dark-elevated border border-dark-border rounded-md text-white placeholder-dark-text-secondary focus:border-electric-magenta focus:outline-none focus:ring-1 focus:ring-electric-magenta"
          />
          <p className="text-sm text-dark-text-secondary">These will be included in all new quotes</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultNotes">Default Notes</Label>
          <textarea
            id="defaultNotes"
            value={formData.defaultNotes}
            onChange={(e) => handleChange("defaultNotes", e.target.value)}
            placeholder="Any default notes to include in quotes..."
            className="w-full min-h-[80px] px-3 py-2 bg-dark-elevated border border-dark-border rounded-md text-white placeholder-dark-text-secondary focus:border-electric-magenta focus:outline-none focus:ring-1 focus:ring-electric-magenta"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Labor Rate Multipliers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="saturdayRateMultiplier">Saturday Rate Multiplier</Label>
            <Input
              id="saturdayRateMultiplier"
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={formData.saturdayRateMultiplier}
              onChange={(e) => handleChange("saturdayRateMultiplier", parseFloat(e.target.value))}
            />
            <p className="text-sm text-dark-text-secondary">Multiply base rate by this for Saturday work</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sundayRateMultiplier">Sunday Rate Multiplier</Label>
            <Input
              id="sundayRateMultiplier"
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={formData.sundayRateMultiplier}
              onChange={(e) => handleChange("sundayRateMultiplier", parseFloat(e.target.value))}
            />
            <p className="text-sm text-dark-text-secondary">Multiply base rate by this for Sunday work</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSaving}
          variant="primary"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}