// Run with: npx tsx scripts/change-role.ts email@example.com MANAGER
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const validRoles = Object.values(UserRole);

async function changeRole() {
  const email = process.argv[2];
  const newRole = process.argv[3] as UserRole;
  
  if (!email || !newRole) {
    console.error('❌ Missing required arguments\n');
    console.log('Usage: npx tsx scripts/change-role.ts <email> <role>');
    console.log('\nAvailable roles:', validRoles.join(', '));
    console.log('\nExample:');
    console.log('  npx tsx scripts/change-role.ts user@example.com MANAGER');
    process.exit(1);
  }
  
  if (!validRoles.includes(newRole)) {
    console.error(`❌ Invalid role: ${newRole}`);
    console.log('\nAvailable roles:', validRoles.join(', '));
    process.exit(1);
  }
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    // Show current state
    console.log(`\n👤 User: ${user.email}`);
    console.log(`📋 Current role: ${user.role}`);
    console.log(`🔄 New role: ${newRole}`);
    
    // Update the role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole },
    });
    
    console.log('\n✅ Role updated successfully!');
    console.log('\n📋 Updated permissions based on role:');
    console.log('  (Use setup-roles.ts to apply role templates)');
    
  } catch (error) {
    console.error('❌ Error changing role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

changeRole();