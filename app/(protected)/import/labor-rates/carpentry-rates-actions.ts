'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Unit mappings from form to database
const unitMappings: Record<string, string> = {
  'SQM': 'm²',
  'LM': 'lm',
  'EA': 'item',
  'Unit': 'item',
  'HR': 'hr',
  'SET': 'set'
};

interface CreateLabourRateParams {
  category: string;
  activity: string;
  unit: string;
  rate: number;
  description?: string;
}

interface LabourRateResult {
  rate_id: number;
  category_name: string;
  item_name: string;
  description: string | null;
  unit_abbreviation: string;
  typical_rate: number;
  min_rate: number;
  max_rate: number;
}

// Get categories from carpentry_rates schema
export async function getCategories() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, data: [], error: 'Unauthorized' };
    }

    const categories = await db.$queryRaw<Array<{ category_id: number; category_name: string }>>`
      SELECT category_id, category_name 
      FROM carpentry_rates.categories 
      ORDER BY category_name
    `;

    return { success: true, data: categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, data: [], error: 'Failed to fetch categories' };
  }
}

// Get units from carpentry_rates schema
export async function getUnits() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, data: [], error: 'Unauthorized' };
    }

    const units = await db.$queryRaw<Array<{ unit_id: number; unit_name: string; unit_abbreviation: string }>>`
      SELECT unit_id, unit_name, unit_abbreviation 
      FROM carpentry_rates.units 
      ORDER BY unit_name
    `;

    return { success: true, data: units };
  } catch (error) {
    console.error('Error fetching units:', error);
    return { success: false, data: [], error: 'Failed to fetch units' };
  }
}

// Create a new labour rate in carpentry_rates schema
export async function createLabourRate(params: CreateLabourRateParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { category, activity, unit, rate, description } = params;
    
    // Map the unit if needed
    const mappedUnit = unitMappings[unit] || unit;

    // Insert the new labour rate
    const result = await db.$queryRaw<Array<{ rate_id: number }>>`
      INSERT INTO carpentry_rates.labour_rates (
        category_id,
        item_name,
        description,
        unit_id,
        min_rate,
        max_rate,
        typical_rate,
        notes,
        created_by
      ) VALUES (
        (SELECT category_id FROM carpentry_rates.categories WHERE category_name = ${category}),
        ${activity},
        ${description || null},
        (SELECT unit_id FROM carpentry_rates.units WHERE unit_abbreviation = ${mappedUnit}),
        ${rate},
        ${rate},
        ${rate},
        'Manually added rate',
        ${userId}
      ) RETURNING rate_id
    `;

    return { success: true, rateId: result[0].rate_id };
  } catch (error) {
    console.error('Error creating labour rate:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return { success: false, error: 'Invalid category or unit' };
      }
    }
    return { success: false, error: 'Failed to create labour rate' };
  }
}

// Get all labour rates for the quote builder
export async function getLabourRates(search?: string, categoryFilter?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, data: [], error: 'Unauthorized' };
    }

    let query = `
      SELECT 
        lr.rate_id,
        c.category_name,
        lr.item_name as activity,
        lr.description,
        u.unit_abbreviation as unit,
        lr.typical_rate as rate,
        lr.min_rate,
        lr.max_rate
      FROM carpentry_rates.labour_rates lr
      JOIN carpentry_rates.categories c ON lr.category_id = c.category_id
      JOIN carpentry_rates.units u ON lr.unit_id = u.unit_id
      WHERE 1=1
    `;

    const params: any[] = [];
    
    if (search) {
      query += ` AND lr.item_name ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    
    if (categoryFilter) {
      query += ` AND c.category_name = $${params.length + 1}`;
      params.push(categoryFilter);
    }
    
    query += ` ORDER BY c.category_name, lr.item_name`;

    const rates = await db.$queryRawUnsafe<LabourRateResult[]>(query, ...params);

    return { success: true, data: rates };
  } catch (error) {
    console.error('Error fetching labour rates:', error);
    return { success: false, data: [], error: 'Failed to fetch labour rates' };
  }
}

// Search labour rates for inline selection in quote builder
export async function searchLabourRates(searchTerm: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, data: [], error: 'Unauthorized' };
    }

    const rates = await db.$queryRaw<LabourRateResult[]>`
      SELECT 
        lr.rate_id,
        c.category_name,
        lr.item_name as activity,
        lr.description,
        u.unit_abbreviation as unit,
        lr.typical_rate as rate,
        lr.min_rate,
        lr.max_rate
      FROM carpentry_rates.labour_rates lr
      JOIN carpentry_rates.categories c ON lr.category_id = c.category_id
      JOIN carpentry_rates.units u ON lr.unit_id = u.unit_id
      WHERE lr.item_name ILIKE ${`%${searchTerm}%`}
      ORDER BY lr.item_name
      LIMIT 10
    `;

    return { success: true, data: rates };
  } catch (error) {
    console.error('Error searching labour rates:', error);
    return { success: false, data: [], error: 'Failed to search labour rates' };
  }
}

// Update an existing labour rate
export async function updateLabourRate(rateId: number, rate: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.$executeRaw`
      UPDATE carpentry_rates.labour_rates
      SET min_rate = ${rate},
          max_rate = ${rate},
          typical_rate = ${rate}
      WHERE rate_id = ${rateId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error updating labour rate:', error);
    return { success: false, error: 'Failed to update labour rate' };
  }
}