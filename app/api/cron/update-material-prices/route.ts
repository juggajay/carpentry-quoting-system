import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MaterialWebScraper } from '@/lib/material-prices/web-scraper';
import { headers } from 'next/headers';

export async function GET() {
  // Verify this is a cron job or authorized request
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  // In production, verify this is from your cron service
  // For Vercel Cron, check for CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all materials
    const materials = await db.material.findMany({
      where: {
        supplier: { not: null }
      },
      take: 100 // Limit to prevent timeout
    });

    console.log(`Found ${materials.length} materials to update`);

    let updated = 0;
    let failed = 0;

    for (const material of materials) {
      try {
        let newPrice: number | null = null;
        
        // Determine scraper based on supplier
        if (material.supplier) {
          const scraper = new MaterialWebScraper({
            source: material.supplier.toLowerCase() === 'bunnings' ? 'bunnings' : 'bunnings',
            materials: [material.name]
          });
          
          const results = await scraper.scrapePrices([material.name]);
          if (results.length > 0) {
            newPrice = results[0].price;
          }
        }

        if (newPrice !== null) {
          await db.material.update({
            where: { id: material.id },
            data: {
              pricePerUnit: newPrice,
              updatedAt: new Date()
            }
          });
          updated++;
          console.log(`Updated ${material.name}: $${newPrice}`);
        } else {
          failed++;
          console.log(`Failed to get price for ${material.name}`);
        }
      } catch (error) {
        failed++;
        console.error(`Error updating ${material.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      total: materials.length,
      updated,
      failed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max