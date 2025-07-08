// Test labor rates functionality
// Run with: npx tsx scripts/test-labor-rates.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLaborRates() {
  const clerkId = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';
  
  console.log('🔍 Testing Labor Rates Setup...\n');
  
  try {
    // 1. Check if user exists and has correct permissions
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        email: true,
        role: true,
        canCreateQuotes: true,
        laborRateTemplates: {
          take: 5
        }
      }
    });
    
    if (!user) {
      console.error('❌ User not found!');
      console.log('   Run the fix-owner-account.sql script first');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Can Create Quotes: ${user.canCreateQuotes}`);
    console.log(`   Labor Rate Templates: ${user.laborRateTemplates.length}`);
    
    // 2. Check if laborRateTemplate table exists
    const templateCount = await prisma.laborRateTemplate.count();
    console.log(`\n📊 Total Labor Rate Templates in database: ${templateCount}`);
    
    // 3. Try to create a test template
    console.log('\n🧪 Testing create operation...');
    const testTemplate = await prisma.laborRateTemplate.create({
      data: {
        category: 'test',
        activity: 'Test Activity',
        unit: 'HR',
        rate: 100,
        description: 'Test labor rate',
        userId: user.id,
        isActive: true
      }
    });
    console.log('✅ Successfully created test template');
    
    // 4. Clean up
    await prisma.laborRateTemplate.delete({
      where: { id: testTemplate.id }
    });
    console.log('🧹 Cleaned up test template');
    
    console.log('\n✅ All tests passed! Labor rates should work.');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('P2025')) {
        console.log('\n💡 The user might not exist in the database.');
        console.log('   Run the fix-owner-account.sql script in Supabase first.');
      } else if (error.message.includes('P2003')) {
        console.log('\n💡 Foreign key constraint error.');
        console.log('   Make sure the user exists before creating labor rates.');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testLaborRates();