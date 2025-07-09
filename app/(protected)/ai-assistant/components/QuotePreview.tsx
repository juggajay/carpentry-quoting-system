"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { GeneratedQuote } from "@/lib/ai-assistant/types";
import ConfidenceIndicator from "./ConfidenceIndicator";

interface QuotePreviewProps {
  quote: GeneratedQuote;
  sessionId?: string;
  onQuoteCreated?: (quoteId: string, quoteNumber: string) => void;
}

export default function QuotePreview({ quote, sessionId, onQuoteCreated }: QuotePreviewProps) {
  const { summary } = quote;
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [createdQuoteNumber, setCreatedQuoteNumber] = useState<string | null>(null);
  
  const handleCreateQuote = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/ai-assistant/create-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteDraft: quote, sessionId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCreatedQuoteId(data.quote.id);
        setCreatedQuoteNumber(data.quote.quoteNumber);
        onQuoteCreated?.(data.quote.id, data.quote.quoteNumber);
      } else {
        console.error('Failed to create quote:', data.error);
      }
    } catch (error) {
      console.error('Error creating quote:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleEditQuote = () => {
    if (createdQuoteId) {
      router.push(`/quotes/${createdQuoteId}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {quote.projectName || 'Generated Quote'}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {quote.status === 'draft' && '(Draft)'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{summary.totalItems}</p>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">Ready for Pricing</p>
            <p className="text-2xl font-bold">{summary.readyForPricing}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Confidence Breakdown</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🟢</span>
                <span className="text-sm">High confidence</span>
              </span>
              <span className="text-sm font-medium">{summary.highConfidence}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🟡</span>
                <span className="text-sm">Medium confidence</span>
              </span>
              <span className="text-sm font-medium">{summary.mediumConfidence}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🔴</span>
                <span className="text-sm">Low confidence</span>
              </span>
              <span className="text-sm font-medium">{summary.lowConfidence}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>❓</span>
                <span className="text-sm">Needs review</span>
              </span>
              <span className="text-sm font-medium">{summary.needsReview}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-2">All Quote Items ({quote.items.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {quote.items.map((item, index) => (
              <div key={item.id} className="text-sm space-y-1 p-2 rounded hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground w-8">{index + 1}.</span>
                  <span className="flex-1">{item.description}</span>
                  <ConfidenceIndicator 
                    confidence={item.confidence} 
                    compact 
                  />
                </div>
                <div className="flex justify-between text-muted-foreground pl-8">
                  <span>{item.quantity} {item.unit}</span>
                  {item.totalPrice > 0 ? (
                    <span>${item.totalPrice.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs italic">Not priced</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {quote.status !== 'draft' && (
          <div className="pt-4 border-t border-border space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%)</span>
              <span>${quote.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {quote.status === 'draft' && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Draft quote - prices not yet calculated
            </p>
            
            <div className="space-y-2">
              {!createdQuoteId ? (
                <Button 
                  onClick={handleCreateQuote}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Creating Quote...' : 'Create Quote in System'}
                </Button>
              ) : (
                <>
                  <div className="text-center text-sm text-green-600 font-medium">
                    ✓ Quote {createdQuoteNumber} created
                  </div>
                  <Button 
                    onClick={handleEditQuote}
                    className="w-full"
                  >
                    Edit in Quote Builder
                  </Button>
                  <Button 
                    onClick={() => router.push(`/quotes/${createdQuoteId}`)}
                    className="w-full"
                    variant="secondary"
                  >
                    View Quote
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}