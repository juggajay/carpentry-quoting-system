// prisma/copy-materials.ts
// Easy script to copy materials from one user to another in Supabase

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CONFIGURATION - EDIT THESE VALUES
const SOURCE_USER_EMAIL = 'source@example.com'; // Email of user to copy FROM
const TARGET_USER_EMAIL = 'target@example.com'; // Email of user to copy TO

async function copyMaterials() {
  try {
    console.log('🚀 Starting material copy process...');
    
    // Find source user
    const sourceUser = await db.user.findUnique({
      where: { email: SOURCE_USER_EMAIL }
    });
    
    if (!sourceUser) {
      console.error(`❌ Source user not found: ${SOURCE_USER_EMAIL}`);
      return;
    }
    
    // Find target user
    const targetUser = await db.user.findUnique({
      where: { email: TARGET_USER_EMAIL }
    });
    
    if (!targetUser) {
      console.error(`❌ Target user not found: ${TARGET_USER_EMAIL}`);
      return;
    }
    
    console.log(`📋 Copying materials from ${SOURCE_USER_EMAIL} to ${TARGET_USER_EMAIL}`);
    
    // Get all materials from source user
    const sourceMaterials = await db.material.findMany({
      where: { userId: sourceUser.id }
    });
    
    console.log(`📦 Found ${sourceMaterials.length} materials to copy`);
    
    let copiedCount = 0;
    let skippedCount = 0;
    
    // Copy each material
    for (const material of sourceMaterials) {
      try {
        // Check if material already exists for target user
        const existing = await db.material.findFirst({
          where: {
            name: material.name,
            userId: targetUser.id
          }
        });
        
        if (existing) {
          console.log(`⏭️  Skipping duplicate: ${material.name}`);
          skippedCount++;
          continue;
        }
        
        // Create copy for target user
        const { id, userId, createdAt, updatedAt, lastScrapedAt, sourceUrl, scraperType, scraperSelectors, ...materialData } = material;
        
        await db.material.create({
          data: {
            ...materialData,
            userId: targetUser.id,
            // Only include new fields if they exist
            ...(lastScrapedAt && { lastScrapedAt }),
            ...(sourceUrl && { sourceUrl }),
            ...(scraperType && { scraperType }),
            ...(scraperSelectors && { scraperSelectors })
          }
        });
        
        console.log(`✅ Copied: ${material.name}`);
        copiedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to copy material: ${material.name}`, error);
      }
    }
    
    console.log('\n📊 Copy Summary:');
    console.log(`✅ Successfully copied: ${copiedCount} materials`);
    console.log(`⏭️  Skipped duplicates: ${skippedCount} materials`);
    console.log(`📦 Total processed: ${sourceMaterials.length} materials`);
    
  } catch (error) {
    console.error('❌ Error during copy process:', error);
  } finally {
    await db.$disconnect();
  }
}

// Alternative: Copy by user ID instead of email
async function copyMaterialsByUserId(sourceUserId: string, targetUserId: string) {
  try {
    console.log('🚀 Starting material copy process...');
    
    // Verify users exist
    const sourceUser = await db.user.findUnique({
      where: { id: sourceUserId }
    });
    
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId }
    });
    
    if (!sourceUser || !targetUser) {
      console.error('❌ One or both users not found');
      return;
    }
    
    // Get all materials from source user
    const sourceMaterials = await db.material.findMany({
      where: { userId: sourceUserId }
    });
    
    console.log(`📦 Found ${sourceMaterials.length} materials to copy`);
    
    // Bulk create materials (faster for large datasets)
    const materialsToCreate = [];
    
    for (const material of sourceMaterials) {
      // Check if material already exists
      const existing = await db.material.findFirst({
        where: {
          name: material.name,
          userId: targetUserId
        }
      });
      
      if (!existing) {
        const { id, userId, createdAt, updatedAt, lastScrapedAt, sourceUrl, scraperType, scraperSelectors, ...materialData } = material;
        materialsToCreate.push({
          ...materialData,
          userId: targetUserId,
          // Only include new fields if they exist
          ...(lastScrapedAt && { lastScrapedAt }),
          ...(sourceUrl && { sourceUrl }),
          ...(scraperType && { scraperType }),
          ...(scraperSelectors && { scraperSelectors })
        });
      }
    }
    
    if (materialsToCreate.length > 0) {
      const result = await db.material.createMany({
        data: materialsToCreate,
        skipDuplicates: true
      });
      
      console.log(`✅ Successfully copied ${result.count} materials`);
    } else {
      console.log('⚠️  No new materials to copy (all already exist)');
    }
    
  } catch (error) {
    console.error('❌ Error during copy process:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
copyMaterials()
  .then(() => {
    console.log('🎉 Copy process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Copy failed:', error);
    process.exit(1);
  });

// USAGE INSTRUCTIONS:
// 1. Edit SOURCE_USER_EMAIL and TARGET_USER_EMAIL at the top of this file
// 2. Run: npx tsx prisma/copy-materials.ts
// 
// Alternative: Use the copyMaterialsByUserId function if you have user IDs:
// - Comment out the copyMaterials() call above
// - Uncomment and edit this line:
// copyMaterialsByUserId('source-user-id', 'target-user-id');