// Run with: npx tsx scripts/setup-roles.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const roleTemplates = {
  OWNER: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewAllQuotes: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true,
  },
  ADMIN: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewAllQuotes: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: false,
  },
  MANAGER: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewAllQuotes: true,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
  },
  EMPLOYEE: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: false,
    canViewAllQuotes: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
  },
  VIEWER: {
    canCreateQuotes: false,
    canEditQuotes: false,
    canDeleteQuotes: false,
    canViewAllQuotes: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
  },
};

async function setupRoles() {
  const action = process.argv[2];
  
  if (!action || !['apply', 'list'].includes(action)) {
    console.log('Usage: npx tsx scripts/setup-roles.ts <action>');
    console.log('\nActions:');
    console.log('  list   - Show all users and their current roles/permissions');
    console.log('  apply  - Apply role-based permission templates to all users');
    process.exit(1);
  }
  
  try {
    if (action === 'list') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
      });
      
      console.log('\n📋 Current Users:\n');
      
      for (const user of users) {
        console.log(`👤 ${user.email} (${user.role})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Clerk ID: ${user.clerkId}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log('   Permissions:');
        console.log(`     Create Quotes: ${user.canCreateQuotes ? '✅' : '❌'}`);
        console.log(`     Edit Quotes: ${user.canEditQuotes ? '✅' : '❌'}`);
        console.log(`     Delete Quotes: ${user.canDeleteQuotes ? '✅' : '❌'}`);
        console.log(`     View All Quotes: ${user.canViewAllQuotes ? '✅' : '❌'}`);
        console.log(`     Manage Users: ${user.canManageUsers ? '✅' : '❌'}`);
        console.log(`     View Reports: ${user.canViewReports ? '✅' : '❌'}`);
        console.log(`     Manage Settings: ${user.canManageSettings ? '✅' : '❌'}`);
        console.log('');
      }
      
      console.log(`Total users: ${users.length}`);
      
    } else if (action === 'apply') {
      console.log('🔧 Applying role-based permission templates...\n');
      
      const users = await prisma.user.findMany();
      
      for (const user of users) {
        const permissions = roleTemplates[user.role];
        
        if (!permissions) {
          console.log(`⚠️  Unknown role for ${user.email}: ${user.role}`);
          continue;
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: permissions,
        });
        
        console.log(`✅ Updated ${user.email} (${user.role})`);
      }
      
      console.log('\n✨ Role permissions applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupRoles();