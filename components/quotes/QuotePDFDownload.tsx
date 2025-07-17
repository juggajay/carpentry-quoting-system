"use client";

import React, { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from '@/components/ui/Button';
import { Download, Eye, Loader2 } from 'lucide-react';
import QuotePDFTemplate from './QuotePDFTemplate';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface QuoteData {
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

interface QuotePDFDownloadProps {
  quote: QuoteData;
  settings: CompanySettings;
  showPreview?: boolean;
}

export const QuotePDFDownload: React.FC<QuotePDFDownloadProps> = ({ 
  quote, 
  settings, 
  showPreview = false 
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(showPreview);
  const [isLoading, setIsLoading] = useState(false);

  const filename = `Quote_${quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const handlePreviewToggle = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  if (isPreviewOpen) {
    return (
      <div className="w-full h-screen">
        <div className="p-4 bg-dark-elevated border-b border-dark-border flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Quote Preview</h3>
          <div className="flex gap-2">
            <PDFDownloadLink
              document={<QuotePDFTemplate quote={quote} settings={settings} />}
              fileName={filename}
            >
              {({ loading }) => (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewToggle}
            >
              Close Preview
            </Button>
          </div>
        </div>
        <PDFViewer width="100%" height="calc(100vh - 80px)">
          <QuotePDFTemplate quote={quote} settings={settings} />
        </PDFViewer>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviewToggle}
      >
        <Eye className="mr-2 h-4 w-4" />
        Preview PDF
      </Button>
      
      <PDFDownloadLink
        document={<QuotePDFTemplate quote={quote} settings={settings} />}
        fileName={filename}
      >
        {({ loading }) => (
          <Button
            variant="primary"
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default QuotePDFDownload;