"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import QuotePDFDownload from './QuotePDFDownload';
import { Loader2 } from 'lucide-react';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  validUntil?: Date;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  termsConditions?: string;
  items: QuoteItem[];
  client?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
  };
}

interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  abn?: string;
  companyLogoUrl?: string;
  defaultTaxRate: number;
}

interface QuoteViewWithPDFProps {
  quote: Quote;
}

/**
 * Example component showing how to integrate PDF download functionality
 * into an existing quote view. This component fetches company settings
 * and provides PDF generation capabilities.
 */
export const QuoteViewWithPDF: React.FC<QuoteViewWithPDFProps> = ({ quote }) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/quote-defaults');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quote Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quote #{quote.quoteNumber}</h1>
          <p className="text-dark-text-secondary">{quote.title}</p>
          {quote.validUntil && (
            <p className="text-sm text-dark-text-secondary mt-1">
              Valid until: {formatDate(quote.validUntil)}
            </p>
          )}
        </div>
        
        {/* PDF Download Actions */}
        <div className="flex gap-3">
          {isLoadingSettings ? (
            <Button disabled variant="outline" size="sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : settings ? (
            <QuotePDFDownload quote={quote} settings={settings} />
          ) : (
            <p className="text-sm text-red-400">Unable to load company settings</p>
          )}
        </div>
      </div>

      {/* Client Information */}
      {quote.client && (
        <div className="bg-dark-elevated p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-white mb-3">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white font-medium">{quote.client.name}</p>
              {quote.client.company && <p className="text-dark-text-secondary">{quote.client.company}</p>}
              {quote.client.address && <p className="text-dark-text-secondary">{quote.client.address}</p>}
            </div>
            <div>
              {quote.client.phone && <p className="text-dark-text-secondary">Phone: {quote.client.phone}</p>}
              {quote.client.email && <p className="text-dark-text-secondary">Email: {quote.client.email}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Quote Items */}
      <div className="bg-dark-elevated p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Quote Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-2 text-dark-text-secondary">Description</th>
                <th className="text-center py-2 text-dark-text-secondary">Qty</th>
                <th className="text-center py-2 text-dark-text-secondary">Unit</th>
                <th className="text-right py-2 text-dark-text-secondary">Unit Price</th>
                <th className="text-right py-2 text-dark-text-secondary">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b border-dark-border/50">
                  <td className="py-3 text-white">{item.description}</td>
                  <td className="py-3 text-center text-dark-text-secondary">{item.quantity}</td>
                  <td className="py-3 text-center text-dark-text-secondary">{item.unit}</td>
                  <td className="py-3 text-right text-dark-text-secondary">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right text-white font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Summary */}
      <div className="bg-dark-elevated p-4 rounded-lg mb-6">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-dark-text-secondary">Subtotal:</span>
              <span className="text-white">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-dark-text-secondary">GST ({settings?.defaultTaxRate || 10}%):</span>
              <span className="text-white">{formatCurrency(quote.tax)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold border-t border-dark-border mt-2 pt-2">
              <span className="text-white">Total:</span>
              <span className="text-electric-magenta">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-dark-elevated p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-white mb-3">Notes</h2>
          <p className="text-dark-text-secondary whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Terms & Conditions */}
      {quote.termsConditions && (
        <div className="bg-dark-elevated p-4 rounded-lg">
          <h2 className="text-lg font-medium text-white mb-3">Terms & Conditions</h2>
          <p className="text-dark-text-secondary text-sm whitespace-pre-wrap">{quote.termsConditions}</p>
        </div>
      )}
    </div>
  );
};

export default QuoteViewWithPDF;