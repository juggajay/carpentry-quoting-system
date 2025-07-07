import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Unit } from '@prisma/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { materials } = await request.json();
    
    if (!materials || !Array.isArray(materials)) {
      return NextResponse.json({ error: 'Invalid materials data' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let imported = 0;
    let updated = 0;
    
    for (const material of materials) {
      try {
        // Check if material already exists (by name and supplier)
        const existing = await prisma.material.findFirst({
          where: {
            name: material.material,
            supplier: material.supplier,
            userId: user.id
          }
        });

        // Map unit string to enum
        const unit = mapUnitToEnum(material.unit);

        if (existing) {
          // Update existing material
          await prisma.material.update({
            where: { id: existing.id },
            data: {
              pricePerUnit: material.price,
              unit,
              inStock: material.inStock,
              lastScrapedAt: new Date(),
              sourceUrl: material.sourceUrl,
              scraperType: 'bunnings'
            }
          });
          updated++;
        } else {
          // Create new material
          await prisma.material.create({
            data: {
              name: material.material,
              supplier: material.supplier,
              pricePerUnit: material.price,
              unit,
              inStock: material.inStock,
              category: categorizeProduct(material.material),
              userId: user.id,
              lastScrapedAt: new Date(),
              sourceUrl: material.sourceUrl,
              scraperType: 'bunnings'
            }
          });
          imported++;
        }
      } catch (error) {
        console.error(`Error importing material ${material.material}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: imported + updated
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function mapUnitToEnum(unit: string): Unit {
  const unitMap: Record<string, Unit> = {
    'EA': Unit.EA,
    'LM': Unit.LM,
    'SQM': Unit.SQM,
    'HR': Unit.HR,
    'DAY': Unit.DAY,
    'PACK': Unit.PACK,
    'KG': Unit.KG,
    'L': Unit.L,
  };
  
  return unitMap[unit] || Unit.EA;
}

function categorizeProduct(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('timber') || name.includes('pine') || name.includes('wood')) {
    return 'Timber';
  }
  if (name.includes('plywood') || name.includes('mdf') || name.includes('sheet')) {
    return 'Sheet Materials';
  }
  if (name.includes('screw') || name.includes('nail') || name.includes('bolt')) {
    return 'Fasteners';
  }
  if (name.includes('adhesive') || name.includes('glue') || name.includes('liquid nails')) {
    return 'Adhesives';
  }
  if (name.includes('paint') || name.includes('primer') || name.includes('stain')) {
    return 'Paint & Finishes';
  }
  
  return 'General';
}