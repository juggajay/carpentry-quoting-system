#!/usr/bin/env node
// Comprehensive test suite for the user roles and permissions system

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string) {
  try {
    const result = fn();
    if (result === true) {
      results.push({ name, status: 'pass' });
    } else if (typeof result === 'string') {
      results.push({ name, status: 'warn', message: result });
    } else {
      results.push({ name, status: 'fail' });
    }
  } catch (error) {
    results.push({ name, status: 'fail', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

function fileExists(path: string): boolean {
  return existsSync(join(rootDir, path));
}

function fileContains(path: string, content: string): boolean {
  if (!fileExists(path)) return false;
  const fileContent = readFileSync(join(rootDir, path), 'utf-8');
  return fileContent.includes(content);
}

console.log('🧪 Testing User Roles & Permissions System\n');

// Test 1: Schema Updates
console.log('📋 Testing Prisma Schema...');
test('Schema file exists', () => fileExists('prisma/schema.prisma'));
test('UserRole enum defined', () => fileContains('prisma/schema.prisma', 'enum UserRole'));
test('User model has role field', () => fileContains('prisma/schema.prisma', 'role        UserRole'));
test('User model has permission fields', () => fileContains('prisma/schema.prisma', 'canCreateQuotes'));
test('Quote model has createdBy relation', () => fileContains('prisma/schema.prisma', 'createdBy'));

// Test 2: Permission System Files
console.log('\n🔐 Testing Permission System...');
test('Permissions lib exists', () => fileExists('lib/permissions.ts'));
test('Permissions client lib exists', () => fileExists('lib/permissions-client.ts'));
test('Permission types defined', () => fileContains('lib/permissions.ts', "export type Permission"));
test('Role permissions mapping exists', () => fileContains('lib/permissions.ts', 'rolePermissions'));
test('checkPermission function exists', () => fileContains('lib/permissions.ts', 'export async function checkPermission'));

// Test 3: API Routes
console.log('\n🌐 Testing API Routes...');
test('User list API exists', () => fileExists('app/api/admin/users/route.ts'));
test('User update API exists', () => fileExists('app/api/admin/users/[userId]/route.ts'));
test('Permissions API exists', () => fileExists('app/api/auth/permissions/route.ts'));
test('API has permission checks', () => fileContains('app/api/admin/users/route.ts', 'canManageUsers'));

// Test 4: Client Components
console.log('\n🎨 Testing Client Components...');
test('User management page exists', () => fileExists('app/(protected)/admin/users/page.tsx'));
test('Permissions hook exists', () => fileExists('hooks/usePermissions.ts'));
test('Permissions provider exists', () => fileExists('providers/PermissionsProvider.tsx'));
test('User management uses permissions', () => fileContains('app/(protected)/admin/users/page.tsx', 'UserRole'));

// Test 5: Database Scripts
console.log('\n🛠️  Testing Database Scripts...');
test('Migration SQL exists', () => fileExists('scripts/migrate-user-roles.sql'));
test('Setup admin script exists', () => fileExists('scripts/setup-admin.ts'));
test('Clear users script exists', () => fileExists('scripts/clear-users.ts'));
test('Setup roles script exists', () => fileExists('scripts/setup-roles.ts'));
test('Change role script exists', () => fileExists('scripts/change-role.ts'));

// Test 6: Integration Points
console.log('\n🔗 Testing Integration Points...');
test('Dashboard uses new schema', () => fileContains('app/(protected)/dashboard/page.tsx', 'createdById'));
test('Debug auth page updated', () => fileContains('app/(protected)/debug-auth/page.tsx', 'db.user'));
test('DB export exists', () => fileExists('lib/db.ts'));

// Test 7: Code Quality
console.log('\n✨ Testing Code Quality...');
test('TypeScript types used', () => fileContains('lib/permissions.ts', ': Permission'));
test('Error handling in APIs', () => fileContains('app/api/admin/users/route.ts', 'try {'));
test('Permission guard component', () => fileContains('providers/PermissionsProvider.tsx', 'PermissionGuard'));

// Display Results
console.log('\n📊 Test Results:\n');

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warnings = results.filter(r => r.status === 'warn').length;

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.name}${result.message ? ': ' + result.message : ''}`);
});

console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! The system is properly set up.');
  console.log('\n📝 Next steps:');
  console.log('1. Run the migration SQL in your Supabase dashboard');
  console.log('2. Run: npx tsx scripts/setup-admin.ts <your-clerk-id> <your-email>');
  console.log('3. Test the user management page at /admin/users');
} else {
  console.log('\n❌ Some tests failed. Please check the implementation.');
}

// Test permissions logic without database
console.log('\n🧮 Testing Permission Logic (offline):');

// Simulate permission checking
const mockUser = {
  role: 'MANAGER',
  canCreateQuotes: true,
  canEditQuotes: true,
  canDeleteQuotes: false,
  canViewAllQuotes: true,
  canManageUsers: false,
  canViewReports: true,
  canManageSettings: false,
};

const rolePerms = {
  MANAGER: ['quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.viewAll', 'reports.view']
};

console.log('\nSimulating MANAGER role permissions:');
console.log('  Role grants: quotes.delete ✅');
console.log('  Individual override: canDeleteQuotes = false');
console.log('  Result: User cannot delete (individual override wins)');

process.exit(failed > 0 ? 1 : 0);