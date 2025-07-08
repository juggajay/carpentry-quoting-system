'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { LaborRateProcessor } from '@/lib/rate-extraction/labor-rate-processor';
import { NormalizedRate } from '@/lib/rate-extraction/rate-normalizer';
import { Unit } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper function to safely get auth
async function getAuthUserId(): Promise<string | null> {
  try {
    const authResult = await auth();
    return authResult?.userId || null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Initialize Supabase client with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

interface UploadResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  error?: string;
}

interface ProcessingResult {
  success: boolean;
  rates: NormalizedRate[];
  errors: string[];
  stats: {
    totalExtracted: number;
    validRates: number;
    invalidRates: number;
    byCategory: Record<string, number>;
  };
}

export async function uploadAndProcessFile(formData: FormData): Promise<{
  upload: UploadResult;
  processing?: ProcessingResult;
}> {
  const userId = await getAuthUserId();
  if (!userId) {
    return {
      upload: { success: false, error: 'Unauthorized' }
    };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return {
      upload: { success: false, error: 'No file provided' }
    };
  }

  // Validate file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const supportedTypes = ['xlsx', 'xls', 'pdf'];
  
  if (!fileExtension || !supportedTypes.includes(fileExtension)) {
    return {
      upload: { success: false, error: 'Unsupported file type. Please upload Excel (.xlsx, .xls) or PDF files.' }
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let fileUrl: string | undefined;
    const fileId = `labor-rates-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Only upload to Supabase if client is initialized
    if (supabase) {
      const filePath = `uploads/labor-rates/${userId}/${fileId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('quotes')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        return {
          upload: { success: false, error: uploadError.message }
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('quotes')
        .getPublicUrl(filePath);
      
      fileUrl = publicUrl;
    }

    // Process the file
    const processor = new LaborRateProcessor();
    const fileType = fileExtension === 'pdf' ? 'pdf' : 'excel';
    const processingResult = await processor.processFile(buffer, file.name, fileType);

    return {
      upload: {
        success: true,
        fileId,
        fileUrl: fileUrl || `local-${fileId}` // Fallback for when Supabase is not available
      },
      processing: processingResult
    };
  } catch (error) {
    console.error('Error uploading and processing file:', error);
    return {
      upload: {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process file'
      }
    };
  }
}

export async function saveLaborRateTemplates(rates: Array<{
  category: string;
  activity: string;
  unit: Unit;
  rate: number;
  description?: string;
  source?: string;
  confidence?: number;
}>): Promise<{ success: boolean; saved: number; errors: string[] }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, saved: 0, errors: ['Unauthorized'] };
  }

  const errors: string[] = [];
  let saved = 0;

  try {
    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return { success: false, saved: 0, errors: ['User not found'] };
    }

    // Save rates in batches to handle potential duplicates
    for (const rate of rates) {
      try {
        await db.laborRateTemplate.upsert({
          where: {
            userId_activity_unit: {
              userId: user.id,
              activity: rate.activity,
              unit: rate.unit
            }
          },
          update: {
            rate: rate.rate,
            category: rate.category,
            description: rate.description,
            source: rate.source,
            confidence: rate.confidence,
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            userId: user.id,
            category: rate.category,
            activity: rate.activity,
            unit: rate.unit,
            rate: rate.rate,
            description: rate.description,
            source: rate.source,
            confidence: rate.confidence,
            isActive: true
          }
        });
        saved++;
      } catch (error) {
        console.error(`Error saving rate ${rate.activity}:`, error);
        errors.push(`Failed to save ${rate.activity}`);
      }
    }

    revalidatePath('/import/labor-rates');
    
    return {
      success: saved > 0,
      saved,
      errors
    };
  } catch (error) {
    console.error('Error saving labor rate templates:', error);
    return {
      success: false,
      saved,
      errors: [error instanceof Error ? error.message : 'Failed to save rates']
    };
  }
}

export async function getLaborRateTemplates(category?: string) {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, data: [], error: 'Unauthorized' };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return { success: false, data: [], error: 'User not found' };
    }

    const where = {
      userId: user.id,
      isActive: true,
      ...(category && { category })
    };

    const rates = await db.laborRateTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { activity: 'asc' }
      ]
    });

    return { success: true, data: rates };
  } catch (error) {
    console.error('Error fetching labor rate templates:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch rates'
    };
  }
}

export async function updateLaborRateTemplate(
  id: string,
  updates: {
    rate?: number;
    description?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify ownership
    const existing = await db.laborRateTemplate.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return { success: false, error: 'Rate not found' };
    }

    await db.laborRateTemplate.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    revalidatePath('/import/labor-rates');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating labor rate template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rate'
    };
  }
}

export async function deleteLaborRateTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify ownership
    const existing = await db.laborRateTemplate.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return { success: false, error: 'Rate not found' };
    }

    await db.laborRateTemplate.delete({
      where: { id }
    });

    revalidatePath('/import/labor-rates');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting labor rate template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rate'
    };
  }
}

export async function deleteLaborRateTemplates(ids: string[]): Promise<{ success: boolean; deleted: number; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, deleted: 0, error: 'Unauthorized' };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return { success: false, deleted: 0, error: 'User not found' };
    }

    // Delete only rates belonging to the user
    const result = await db.laborRateTemplate.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id
      }
    });

    revalidatePath('/import/labor-rates');
    
    return { success: true, deleted: result.count };
  } catch (error) {
    console.error('Error deleting labor rate templates:', error);
    return {
      success: false,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Failed to delete rates'
    };
  }
}