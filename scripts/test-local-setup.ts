#!/usr/bin/env node
// Test local development setup with Clerk

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

async function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red : 
                type === 'warn' ? colors.yellow : 
                colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

async function testLocalSetup() {
  log('\n🧪 Testing Local Development Setup\n', 'info');

  // Test 1: Environment Variables
  log('1️⃣  Checking Environment Variables...', 'info');
  const envVars = {
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Not set',
    'DATABASE_URL': process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  let allEnvSet = true;
  for (const [key, value] of Object.entries(envVars)) {
    if (!value || value === '❌ Not set') {
      log(`   ❌ ${key}: Not set`, 'error');
      allEnvSet = false;
    } else {
      log(`   ✅ ${key}: ${value.substring(0, 20)}...`, 'success');
    }
  }

  // Test 2: Clerk Configuration
  log('\n2️⃣  Checking Clerk Configuration...', 'info');
  const isDevKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('test');
  if (isDevKey) {
    log('   ✅ Using Clerk development keys', 'success');
  } else {
    log('   ⚠️  Using Clerk production keys in development', 'warn');
  }

  // Test 3: Database Connection
  log('\n3️⃣  Testing Database Connection...', 'info');
  try {
    await prisma.$connect();
    log('   ✅ Database connection successful', 'success');
    
    // Check if migrations have been run
    try {
      const userCount = await prisma.user.count();
      log(`   ✅ User table exists (${userCount} users)`, 'success');
      
      // Check for new columns
      const firstUser = await prisma.user.findFirst();
      if (firstUser && 'role' in firstUser) {
        log('   ✅ User role column exists', 'success');
      } else {
        log('   ❌ User role column missing - run migration', 'error');
      }
    } catch (e) {
      log('   ❌ Database schema outdated - run migrations', 'error');
    }
  } catch (error) {
    log('   ❌ Database connection failed', 'error');
    log(`      ${error}`, 'error');
  } finally {
    await prisma.$disconnect();
  }

  // Test 4: API Routes (if server is running)
  log('\n4️⃣  Testing API Routes...', 'info');
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${baseUrl}/api/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (healthResponse.ok) {
      log('   ✅ API server is running', 'success');
      const health = await healthResponse.json();
      log(`   ✅ Database status: ${health.database}`, 'success');
    } else {
      log('   ⚠️  Server running but health check failed', 'warn');
    }
  } catch (error) {
    log('   ❌ Server not running on localhost:3000', 'error');
    log('      Run: npm run dev', 'info');
  }

  // Test 5: File Structure
  log('\n5️⃣  Checking File Structure...', 'info');
  const requiredFiles = [
    'app/(protected)/admin/users/page.tsx',
    'lib/permissions.ts',
    'app/api/admin/users/route.ts',
    'scripts/setup-admin.ts',
  ];

  const fs = require('fs');
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`   ✅ ${file}`, 'success');
    } else {
      log(`   ❌ ${file} missing`, 'error');
    }
  }

  // Summary
  log('\n📊 Summary:', 'info');
  log('─'.repeat(50), 'info');
  
  if (!allEnvSet) {
    log('\n⚠️  Some environment variables are missing', 'warn');
    log('   Check your .env.local file', 'info');
  }

  log('\n📝 Next Steps:', 'info');
  log('1. Start the dev server: npm run dev', 'info');
  log('2. Visit http://localhost:3000', 'info');
  log('3. Sign in with Clerk', 'info');
  log('4. Visit /debug-auth to get your Clerk ID', 'info');
  log('5. Run: npx tsx scripts/setup-admin.ts <clerk-id> <email>', 'info');
  log('6. Visit /admin/users to manage permissions', 'info');
}

// Handle missing node-fetch
testLocalSetup().catch(error => {
  if (error.code === 'MODULE_NOT_FOUND') {
    log('Installing node-fetch...', 'info');
    require('child_process').execSync('npm install --save-dev node-fetch@2', { stdio: 'inherit' });
    log('Please run the script again', 'info');
  } else {
    console.error(error);
  }
});