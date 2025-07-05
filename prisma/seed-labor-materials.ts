// prisma/seed-labor-materials.ts
import { PrismaClient, Unit } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLaborRates(userId: string) {
  const laborRates = [
    { title: 'Carpenter', level: 'CW3', baseRate: 45.50, loadedRate: 68.25 },
    { title: 'Carpenter', level: 'CW2', baseRate: 42.80, loadedRate: 64.20 },
    { title: 'Leading Hand', level: '', baseRate: 49.50, loadedRate: 74.25 },
    { title: 'Apprentice', level: '1st Year', baseRate: 22.75, loadedRate: 34.13 },
    { title: 'Apprentice', level: '2nd Year', baseRate: 27.30, loadedRate: 40.95 },
    { title: 'Apprentice', level: '3rd Year', baseRate: 36.40, loadedRate: 54.60 },
    { title: 'Apprentice', level: '4th Year', baseRate: 40.95, loadedRate: 61.43 },
    { title: 'Labourer', level: 'CW1', baseRate: 35.20, loadedRate: 52.80 },
  ];

  for (const rate of laborRates) {
    await prisma.laborRate.create({
      data: {
        ...rate,
        saturdayRate: rate.baseRate * 1.5,
        sundayRate: rate.baseRate * 2,
        effectiveDate: new Date(),
        userId,
      },
    });
  }
}

async function seedMaterials(userId: string) {
  const materials = [
    // Timber
    { name: '90x45 MGP10 Pine', unit: Unit.LM, pricePerUnit: 8.50, category: 'Timber' },
    { name: '70x35 MGP10 Pine', unit: Unit.LM, pricePerUnit: 5.20, category: 'Timber' },
    { name: '190x35 MGP10 Pine', unit: Unit.LM, pricePerUnit: 16.80, category: 'Timber' },
    { name: 'Plywood Structural 12mm', unit: Unit.SQM, pricePerUnit: 45.00, category: 'Sheet' },
    
    // Hardware
    { name: 'Joist Hanger 90x45', unit: Unit.EA, pricePerUnit: 3.50, category: 'Hardware' },
    { name: 'Triple Grip 90mm', unit: Unit.PACK, pricePerUnit: 4.20, category: 'Hardware' },
    
    // Add more materials as needed
  ];

  for (const material of materials) {
    await prisma.material.create({
      data: {
        ...material,
        supplier: 'Bunnings',
        gstInclusive: true,
        inStock: true,
        userId,
      },
    });
  }
}

export async function seedLaborAndMaterials(userId: string) {
  console.log('Seeding labor rates...');
  await seedLaborRates(userId);
  
  console.log('Seeding materials...');
  await seedMaterials(userId);
  
  console.log('Seeding completed!');
}

// Main function for standalone execution
async function main() {
  // You can replace this with a specific user ID or fetch from database
  const userId = process.env.SEED_USER_ID || 'default-user-id';
  
  try {
    await seedLaborAndMaterials(userId);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}