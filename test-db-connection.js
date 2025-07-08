const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL_POOLED exists:', !!process.env.DATABASE_URL_POOLED);
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test the connection
    const userCount = await prisma.user.count();
    console.log('✅ Database connected successfully!');
    console.log(`Found ${userCount} users in the database`);
    
    // Test creating a user if none exist
    if (userCount === 0) {
      console.log('No users found. You may need to create a user first.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P1001') {
      console.error('Cannot reach database server. Check if:');
      console.error('1. Your database server is running');
      console.error('2. Network connection is available');
      console.error('3. Firewall/security groups allow the connection');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();