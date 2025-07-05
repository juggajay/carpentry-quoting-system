'use client';

import { useRouter } from 'next/navigation';
import QuoteForm, { type QuoteFormData } from '@/features/quote-builder/components/QuoteForm';
import { createQuote } from '@/features/quote-builder/actions';
import { toast } from 'sonner';

export default function CreateQuotePage() {
  const router = useRouter();

  const handleSubmit = async (data: QuoteFormData) => {
    console.log('1. Form submitted:', data);
    
    const result = await createQuote(data);
    console.log('2. Create quote result:', result);
    
    if (result.success) {
      toast.success('Quote created successfully!');
      console.log('3. Navigating to:', `/quotes/${result.quoteId}`);
      router.push(`/quotes/${result.quoteId}`);
    } else {
      console.error('3. Error:', result.error);
      toast.error(result.error || 'Failed to create quote');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create New Quote</h1>
        <p className="text-muted-foreground">
          Create a professional quote for your carpentry project
        </p>
      </div>

      <QuoteForm onSubmit={handleSubmit} />
    </div>
  );
}