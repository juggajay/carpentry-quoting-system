"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { GeneratedQuote } from "@/lib/ai-assistant/types";
import ConfidenceIndicator from "./ConfidenceIndicator";

interface QuotePreviewProps {
  quote: GeneratedQuote;
}

export default function QuotePreview({ quote }: QuotePreviewProps) {
  const { summary } = quote;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Quote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{summary.totalItems}</p>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">${quote.total.toFixed(2)}</p>
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
          <h4 className="font-medium mb-2">Quote Items</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {quote.items.slice(0, 5).map((item) => (
              <div key={item.id} className="text-sm space-y-1">
                <div className="flex items-start justify-between">
                  <span className="flex-1">{item.description}</span>
                  <ConfidenceIndicator 
                    confidence={item.confidence} 
                    compact 
                  />
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{item.quantity} {item.unit}</span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {quote.items.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                And {quote.items.length - 5} more items...
              </p>
            )}
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}