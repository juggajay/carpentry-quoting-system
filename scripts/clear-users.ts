import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function clearUsers() {
  console.log('🗑️  Clearing all users from database...');
  
  try {
    // Delete in correct order due to foreign key constraints
    console.log('📄 Deleting quotes...');
    const quotesResult = await db.quote.deleteMany({});
    console.log(`✅ Deleted ${quotesResult.count} quotes`);
    
    console.log('👥 Deleting clients...');
    const clientsResult = await db.client.deleteMany({});
    console.log(`✅ Deleted ${clientsResult.count} clients`);
    
    console.log('📁 Deleting uploaded files...');
    const filesResult = await db.uploadedFile.deleteMany({});
    console.log(`✅ Deleted ${filesResult.count} files`);
    
    console.log('👤 Deleting users...');
    const usersResult = await db.user.deleteMany({});
    console.log(`✅ Deleted ${usersResult.count} users`);
    
    console.log('\n✨ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  } finally {
    await db.$disconnect();
  }
}

// Add confirmation for safety
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will delete ALL users and related data from the database!');
rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    clearUsers();
  } else {
    console.log('❌ Operation cancelled');
    process.exit(0);
  }
  rl.close();
});