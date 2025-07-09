const { PrismaClient } = require('@prisma/client');

async function checkDatabaseSchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database schema...\n');
    
    // Check if EstimatorSession table exists
    try {
      const sessionCount = await prisma.estimatorSession.count();
      console.log('✅ EstimatorSession table exists. Count:', sessionCount);
    } catch (error) {
      console.log('❌ EstimatorSession table not found:', error.message);
    }
    
    // Check if EstimatorAnalysis table exists
    try {
      const analysisCount = await prisma.estimatorAnalysis.count();
      console.log('✅ EstimatorAnalysis table exists. Count:', analysisCount);
    } catch (error) {
      console.log('❌ EstimatorAnalysis table not found:', error.message);
    }
    
    // Check if EstimatorQuestion table exists
    try {
      const questionCount = await prisma.estimatorQuestion.count();
      console.log('✅ EstimatorQuestion table exists. Count:', questionCount);
    } catch (error) {
      console.log('❌ EstimatorQuestion table not found:', error.message);
    }
    
    // Check if User table exists and has data
    try {
      const userCount = await prisma.user.count();
      console.log('✅ User table exists. Count:', userCount);
    } catch (error) {
      console.log('❌ User table not found:', error.message);
    }
    
    console.log('\nDatabase connection successful!');
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema();