// Test database connection and schema
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Check if tables exist
    console.log('📊 Checking database schema:');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`  ✅ User table exists (${userCount} users)`);
    } catch (e) {
      console.log('  ❌ User table not found');
    }
    
    try {
      const quoteCount = await prisma.quote.count();
      console.log(`  ✅ Quote table exists (${quoteCount} quotes)`);
    } catch (e) {
      console.log('  ❌ Quote table not found');
    }
    
    try {
      const clientCount = await prisma.client.count();
      console.log(`  ✅ Client table exists (${clientCount} clients)`);
    } catch (e) {
      console.log('  ❌ Client table not found');
    }
    
    // Test if new columns exist
    console.log('\n🔍 Checking new schema columns:');
    try {
      const testUser = await prisma.user.findFirst();
      if (testUser) {
        console.log('  ✅ Role column:', 'role' in testUser ? 'exists' : 'missing');
        console.log('  ✅ firstName column:', 'firstName' in testUser ? 'exists' : 'missing');
        console.log('  ✅ Permissions columns:', 'canCreateQuotes' in testUser ? 'exists' : 'missing');
      } else {
        console.log('  ℹ️  No users found to test columns');
      }
    } catch (e) {
      console.log('  ❌ Error checking columns:', e);
    }
    
    console.log('\n✨ Database test complete!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('\n💡 Make sure to:');
    console.log('  1. Run the migration SQL in Supabase');
    console.log('  2. Check your DATABASE_URL in .env');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();