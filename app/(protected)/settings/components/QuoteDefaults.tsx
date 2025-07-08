"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().min(1, "Company phone is required"),
  companyEmail: z.string().email("Invalid email address"),
  abn: z.string().optional(),
  defaultTaxRate: z.coerce.number().min(0).max(100),
  defaultValidityDays: z.coerce.number().min(1).max(365),
  defaultTermsConditions: z.string().optional(),
  defaultNotes: z.string().optional(),
  defaultUnit: z.enum(["EA", "M", "M2", "M3", "LM", "L", "KG", "HOUR", "DAY", "WEEK"]),
  saturdayRateMultiplier: z.coerce.number().min(1).max(3),
  sundayRateMultiplier: z.coerce.number().min(1).max(3),
});

type FormData = z.infer<typeof formSchema>;

export default function QuoteDefaults() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
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
          form.reset(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/quote-defaults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Success",
        description: "Quote default settings saved successfully",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-electric-magenta" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Company Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your Company Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABN</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12345678901" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+61 400 000 000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="info@company.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="123 Main St, City, State 1234" 
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Quote Defaults</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="defaultTaxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" max="100" step="0.1" />
                  </FormControl>
                  <FormDescription>GST or tax percentage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultValidityDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Validity (days)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="1" max="365" />
                  </FormControl>
                  <FormDescription>Days until quote expires</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="defaultTermsConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Terms & Conditions</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Enter your standard terms and conditions..." 
                    className="min-h-[120px]"
                  />
                </FormControl>
                <FormDescription>
                  These will be included in all new quotes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Any default notes to include in quotes..." 
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Labor Rate Multipliers</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="saturdayRateMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saturday Rate Multiplier</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="1" max="3" step="0.1" />
                  </FormControl>
                  <FormDescription>
                    Multiply base rate by this for Saturday work
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sundayRateMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sunday Rate Multiplier</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="1" max="3" step="0.1" />
                  </FormControl>
                  <FormDescription>
                    Multiply base rate by this for Sunday work
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-electric-magenta hover:bg-electric-magenta/90"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}