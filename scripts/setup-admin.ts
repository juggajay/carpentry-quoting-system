// Run with: npx tsx scripts/setup-admin.ts your-clerk-id your-email@example.com
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAdmin() {
  const clerkId = process.argv[2];
  const email = process.argv[3];
  const firstName = process.argv[4] || null;
  const lastName = process.argv[5] || null;
  
  if (!clerkId || !email) {
    console.error('❌ Missing required arguments\n');
    console.log('Usage: npx tsx scripts/setup-admin.ts <clerkId> <email> [firstName] [lastName]');
    console.log('\nExample:');
    console.log('  npx tsx scripts/setup-admin.ts user_2abc123 admin@example.com John Doe\n');
    console.log('To find your Clerk ID:');
    console.log('  1. Sign in to your application');
    console.log('  2. Visit /debug-auth to see your Clerk user ID');
    process.exit(1);
  }
  
  try {
    console.log('🔧 Setting up admin user...\n');
    
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        firstName,
        lastName,
        role: UserRole.OWNER,
        isActive: true,
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: true,
        canViewAllQuotes: true,
        canManageUsers: true,
        canViewReports: true,
        canManageSettings: true,
      },
      create: {
        clerkId,
        email,
        firstName,
        lastName,
        role: UserRole.OWNER,
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
    
    console.log('✅ Admin user created/updated successfully!\n');
    console.log('📋 User Details:');
    console.log('  Email:', user.email);
    console.log('  Name:', [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not set');
    console.log('  Role:', user.role);
    console.log('  Status:', user.isActive ? 'Active' : 'Inactive');
    
    console.log('\n🔓 Permissions:');
    console.log('  ✓ Create Quotes:', user.canCreateQuotes);
    console.log('  ✓ Edit Quotes:', user.canEditQuotes);
    console.log('  ✓ Delete Quotes:', user.canDeleteQuotes);
    console.log('  ✓ View All Quotes:', user.canViewAllQuotes);
    console.log('  ✓ Manage Users:', user.canManageUsers);
    console.log('  ✓ View Reports:', user.canViewReports);
    console.log('  ✓ Manage Settings:', user.canManageSettings);
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Sign in with this Clerk account');
    console.log('  2. Visit /admin/users to manage other users');
    console.log('  3. Visit /dashboard to access the main application');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.error('\n⚠️  This email might already be in use by another user');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();