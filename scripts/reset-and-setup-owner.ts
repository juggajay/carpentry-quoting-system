// Reset all users and setup a single OWNER
// Run with: npx tsx scripts/reset-and-setup-owner.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAndSetupOwner() {
  const clerkId = 'user_2zP6d1S9ItBzgW0H14yQxboNGQ7';
  const email = 'jaysonryan21@hotmail.com';
  
  console.log('🔄 Resetting users and setting up OWNER...\n');
  
  try {
    // Step 1: Delete all existing data in order
    console.log('🗑️  Deleting existing data...');
    
    await prisma.quote.deleteMany({});
    console.log('   ✅ Deleted all quotes');
    
    await prisma.client.deleteMany({});
    console.log('   ✅ Deleted all clients');
    
    await prisma.uploadedFile.deleteMany({});
    console.log('   ✅ Deleted all files');
    
    await prisma.material.deleteMany({});
    console.log('   ✅ Deleted all materials');
    
    await prisma.laborRate.deleteMany({});
    console.log('   ✅ Deleted all labor rates');
    
    await prisma.laborRateTemplate.deleteMany({});
    console.log('   ✅ Deleted all labor rate templates');
    
    await prisma.user.deleteMany({});
    console.log('   ✅ Deleted all users\n');
    
    // Step 2: Create the OWNER user
    console.log('👤 Creating OWNER user...');
    
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstName: 'Jayson',
        lastName: 'Ryan',
        role: 'OWNER',
        isActive: true,
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: true,
        canViewAllQuotes: true,
        canManageUsers: true,
        canViewReports: true,
        canManageSettings: true,
      },
    });
    
    console.log('\n✅ Successfully created OWNER user!');
    console.log('\n📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log('\n🔓 Permissions: All permissions granted');
    
    console.log('\n🎉 Setup complete! You are now the OWNER.');
    console.log('\n📝 Next steps:');
    console.log('   1. Sign in to your application');
    console.log('   2. Visit /admin/users to manage other users');
    console.log('   3. Start creating quotes!');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.error('\n⚠️  This Clerk ID or email might already exist.');
      console.error('   Try running the script again or check your database.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetAndSetupOwner();