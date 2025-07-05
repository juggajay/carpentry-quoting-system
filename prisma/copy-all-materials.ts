// prisma/copy-all-materials.ts
// Super simple script to copy ALL materials from ALL users to a specific user

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// EDIT THIS: Email of the user who should receive all materials
const TARGET_USER_EMAIL = 'your-email@example.com';

async function copyAllMaterials() {
  try {
    console.log('🚀 Starting to copy ALL materials...');
    
    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email: TARGET_USER_EMAIL }
    });
    
    if (!targetUser) {
      console.error(`❌ User not found: ${TARGET_USER_EMAIL}`);
      console.log('💡 Make sure to sign in to the app first to create your user account!');
      return;
    }
    
    console.log(`👤 Copying all materials to: ${TARGET_USER_EMAIL}`);
    
    // Get ALL materials from the database
    const allMaterials = await prisma.material.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${allMaterials.length} total materials in database`);
    
    // Group materials by name to avoid duplicates
    const uniqueMaterials = new Map();
    
    for (const material of allMaterials) {
      // Keep the first occurrence of each material name
      if (!uniqueMaterials.has(material.name)) {
        uniqueMaterials.set(material.name, material);
      }
    }
    
    console.log(`🔍 Found ${uniqueMaterials.size} unique materials`);
    
    let copiedCount = 0;
    let skippedCount = 0;
    
    // Copy each unique material
    for (const [name, material] of uniqueMaterials) {
      try {
        // Check if user already has this material
        const existing = await prisma.material.findFirst({
          where: {
            name: material.name,
            userId: targetUser.id
          }
        });
        
        if (existing) {
          skippedCount++;
          continue;
        }
        
        // Create copy for target user
        const { id, userId, createdAt, updatedAt, ...materialData } = material;
        
        await prisma.material.create({
          data: {
            ...materialData,
            userId: targetUser.id
          }
        });
        
        copiedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to copy: ${material.name}`);
      }
    }
    
    console.log('\n✨ Copy Complete!');
    console.log(`✅ Copied: ${copiedCount} new materials`);
    console.log(`⏭️  Skipped: ${skippedCount} existing materials`);
    console.log(`📊 Total: ${copiedCount + skippedCount} materials processed`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
copyAllMaterials()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

// USAGE:
// 1. Edit TARGET_USER_EMAIL above to your email
// 2. Run: npx tsx prisma/copy-all-materials.ts