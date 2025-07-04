"use client";

import { useRouter } from "next/navigation";
import QuoteForm from "@/features/quote-builder/components/QuoteForm";
import { createQuote } from "@/features/quote-builder/actions";
import { toast } from "sonner";

export default function NewQuotePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const result = await createQuote(data);
    
    if (result.success) {
      toast.success("Quote created successfully!");
      router.push(`/quotes/${result.quoteId}`);
    } else {
      toast.error(result.error || "Failed to create quote");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create New Quote</h1>
        <p className="text-text-secondary">
          Build and customize your quote with real-time calculations
        </p>
      </div>

      <QuoteForm onSubmit={handleSubmit} />
    </div>
  );
}