import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as scrapeRoute } from '@/app/api/materials/scrape/route';
import { POST as importRoute } from '@/app/api/materials/import/route';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/firecrawl-service', () => ({
  getFirecrawlService: () => ({
    scrapeWithConfig: vi.fn().mockResolvedValue([
      {
        name: 'Pine Stud 70x35mm - 2.4m',
        price: 24.50,
        sku: 'PS7035-24',
        unit: 'length',
        inStock: true,
        category: 'Timber',
      },
      {
        name: 'Treated Pine 90x45mm - 3.6m',
        price: 45.00,
        sku: 'TP9045-36',
        unit: 'length',
        inStock: true,
        category: 'Timber',
      },
    ]),
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    material: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Firecrawl Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'test-user-id' });
  });

  describe('Scrape Endpoint', () => {
    it('should scrape products successfully', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/materials/scrape', {
        method: 'POST',
        body: JSON.stringify({
          supplier: 'bunnings',
          category: 'timber',
          options: {
            updateExisting: false,
            importNew: true,
            includeGST: true,
          },
        }),
      });

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.material.findMany).mockResolvedValue([]);

      const response = await scrapeRoute(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(2);
      expect(data.summary).toEqual({
        total: 2,
        new: 2,
        existing: 0,
        errors: 0,
      });
    });

    it('should mark existing products correctly', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/materials/scrape', {
        method: 'POST',
        body: JSON.stringify({
          supplier: 'bunnings',
          options: {
            updateExisting: true,
            importNew: true,
            includeGST: true,
          },
        }),
      });

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.material.findMany).mockResolvedValue([
        { sku: 'PS7035-24' } as any,
      ]);

      const response = await scrapeRoute(mockRequest);
      const data = await response.json();

      expect(data.products[0].status).toBe('existing');
      expect(data.products[1].status).toBe('new');
      expect(data.summary.existing).toBe(1);
      expect(data.summary.new).toBe(1);
    });

    it('should handle authentication error', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null });

      const mockRequest = new NextRequest('http://localhost:3000/api/materials/scrape', {
        method: 'POST',
        body: JSON.stringify({ supplier: 'bunnings', options: {} }),
      });

      const response = await scrapeRoute(mockRequest);
      expect(response.status).toBe(401);
    });
  });

  describe('Import Endpoint', () => {
    it('should import new materials successfully', async () => {
      const products = [
        {
          name: 'Pine Stud 70x35mm',
          sku: 'NEW-001',
          supplier: 'Bunnings',
          unit: 'LM',
          pricePerUnit: 10.20,
          gstInclusive: true,
          category: 'Pine',
          inStock: true,
        },
      ];

      const mockRequest = new NextRequest('http://localhost:3000/api/materials/import', {
        method: 'POST',
        body: JSON.stringify({
          products,
          options: {
            updateExisting: false,
            importNew: true,
          },
        }),
      });

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.material.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops) => ops);

      const response = await importRoute(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results.imported).toBe(1);
      expect(data.results.updated).toBe(0);
      expect(data.results.skipped).toBe(0);
    });

    it('should update existing materials when enabled', async () => {
      const products = [
        {
          name: 'Pine Stud Updated',
          sku: 'EXISTING-001',
          supplier: 'Bunnings',
          unit: 'LM',
          pricePerUnit: 12.50,
          gstInclusive: true,
          category: 'Pine',
          inStock: false,
        },
      ];

      const mockRequest = new NextRequest('http://localhost:3000/api/materials/import', {
        method: 'POST',
        body: JSON.stringify({
          products,
          options: {
            updateExisting: true,
            importNew: false,
          },
        }),
      });

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.material.findMany).mockResolvedValue([
        { id: 'mat-123', sku: 'EXISTING-001' } as any,
      ]);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops) => ops);

      const response = await importRoute(mockRequest);
      const data = await response.json();

      expect(data.results.updated).toBe(1);
      expect(data.results.imported).toBe(0);
    });

    it('should skip existing materials when update disabled', async () => {
      const products = [
        {
          name: 'Existing Product',
          sku: 'SKIP-001',
          supplier: 'Bunnings',
          unit: 'EA',
          pricePerUnit: 15.00,
          gstInclusive: true,
          category: 'Hardware',
          inStock: true,
        },
      ];

      const mockRequest = new NextRequest('http://localhost:3000/api/materials/import', {
        method: 'POST',
        body: JSON.stringify({
          products,
          options: {
            updateExisting: false,
            importNew: true,
          },
        }),
      });

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.material.findMany).mockResolvedValue([
        { id: 'mat-456', sku: 'SKIP-001' } as any,
      ]);

      const response = await importRoute(mockRequest);
      const data = await response.json();

      expect(data.results.skipped).toBe(1);
      expect(data.results.imported).toBe(0);
      expect(data.results.updated).toBe(0);
    });

    it('should handle batch operations', async () => {
      const products = Array(75).fill(null).map((_, i) => ({
        name: `Product ${i}`,
        sku: `BATCH-${i}`,
        supplier: 'Bunnings',
        unit: 'EA',
        pricePerUnit: 10 + i,
        gstInclusive: true,
        category: 'Test',
        inStock: true,
      }));

      const mockRequest = new NextRequest('http://localhost:3000/api/materials/import', {
        method: 'POST',
        body: JSON.stringify({
          products,
          options: {
            updateExisting: false,
            importNew: true,
          },
        }),
      });

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.material.findMany).mockResolvedValue([]);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops) => ops);

      const response = await importRoute(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.results.imported).toBe(75);
      // Verify batching occurred (50 items per batch)
      expect(vi.mocked(prisma.material.findMany)).toHaveBeenCalledTimes(2);
    });
  });
});