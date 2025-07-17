"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

interface QuotePDFTemplateProps {
  quote: QuoteData;
  settings: CompanySettings;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 80,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  col: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
  },
  tableCellCenter: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  summary: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: 200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  terms: {
    marginTop: 15,
    fontSize: 8,
    color: '#666',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

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

export const QuotePDFTemplate: React.FC<QuotePDFTemplateProps> = ({ quote, settings }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo and Company Info */}
      <View style={styles.header}>
        {settings.companyLogoUrl && (
          <Image style={styles.logo} src={settings.companyLogoUrl} />
        )}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{settings.companyName}</Text>
          <Text>{settings.companyAddress}</Text>
          <Text>Phone: {settings.companyPhone}</Text>
          <Text>Email: {settings.companyEmail}</Text>
          {settings.abn && <Text>ABN: {settings.abn}</Text>}
        </View>
      </View>

      {/* Quote Title */}
      <Text style={styles.quoteTitle}>QUOTATION</Text>

      {/* Quote Details */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Quote Details</Text>
            <Text>Quote Number: {quote.quoteNumber}</Text>
            <Text>Title: {quote.title}</Text>
            {quote.validUntil && (
              <Text>Valid Until: {formatDate(quote.validUntil)}</Text>
            )}
          </View>
          {quote.client && (
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Client Information</Text>
              <Text>{quote.client.name}</Text>
              {quote.client.company && <Text>{quote.client.company}</Text>}
              {quote.client.address && <Text>{quote.client.address}</Text>}
              {quote.client.phone && <Text>Phone: {quote.client.phone}</Text>}
              {quote.client.email && <Text>Email: {quote.client.email}</Text>}
            </View>
          )}
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.table}>
        <Text style={styles.sectionTitle}>Quote Items</Text>
        
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
          <Text style={styles.tableCellCenter}>Qty</Text>
          <Text style={styles.tableCellCenter}>Unit</Text>
          <Text style={styles.tableCellRight}>Unit Price</Text>
          <Text style={styles.tableCellRight}>Total</Text>
        </View>

        {/* Table Rows */}
        {quote.items.map((item, index) => (
          <View key={item.id || index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
            <Text style={styles.tableCellCenter}>{item.quantity}</Text>
            <Text style={styles.tableCellCenter}>{item.unit}</Text>
            <Text style={styles.tableCellRight}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.tableCellRight}>{formatCurrency(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text>Subtotal:</Text>
          <Text>{formatCurrency(quote.subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>GST ({settings.defaultTaxRate}%):</Text>
          <Text>{formatCurrency(quote.tax)}</Text>
        </View>
        <View style={styles.summaryTotal}>
          <Text>Total:</Text>
          <Text>{formatCurrency(quote.total)}</Text>
        </View>
      </View>

      {/* Notes */}
      {quote.notes && (
        <View style={styles.notes}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text>{quote.notes}</Text>
        </View>
      )}

      {/* Terms and Conditions */}
      {quote.termsConditions && (
        <View style={styles.terms}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text>{quote.termsConditions}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated on {formatDate(new Date())}</Text>
        <Text>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
);

export default QuotePDFTemplate;