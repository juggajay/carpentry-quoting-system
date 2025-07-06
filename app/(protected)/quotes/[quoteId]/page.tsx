"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import QuoteForm, { type QuoteFormData } from "@/features/quote-builder/components/QuoteForm";
import { loadQuote, updateQuote } from "@/features/quote-builder/actions";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ quoteId: string }>;
}

export default function EditQuotePage({ params }: PageProps) {
  const { quoteId } = use(params);
  const router = useRouter();
  const [initialData, setInitialData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const result = await loadQuote(quoteId);
      
      if (result.success && result.data) {
        setInitialData(result.data as QuoteFormData);
      } else {
        toast.error(result.error || "Failed to load quote");
        router.push("/quotes");
      }
      
      setLoading(false);
    };

    fetchQuote();
  }, [quoteId, router]);

  const handleSubmit = async (data: QuoteFormData) => {
    const result = await updateQuote(quoteId, data);
    
    if (result.success) {
      toast.success("Quote updated successfully!");
      router.push(`/quotes/${quoteId}`);
    } else {
      toast.error(result.error || "Failed to update quote");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-background-hover rounded w-1/3"></div>
          <div className="h-4 bg-background-hover rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            <div className="h-48 bg-background-hover rounded"></div>
            <div className="h-48 bg-background-hover rounded"></div>
            <div className="h-96 bg-background-hover rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Edit Quote</h1>
        <p className="text-muted-foreground">
          Make changes to your quote and save when ready
        </p>
      </div>

      <QuoteForm 
        initialData={initialData || undefined} 
        quoteId={quoteId}
        onSubmit={handleSubmit} 
      />
    </div>
  );
}