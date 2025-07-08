// prisma/seed-materials.ts
// This file seeds the materials database with GL Beam prices and other construction materials

import { PrismaClient, Unit } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMaterials(userId: string) {
  console.log('🔄 Starting materials seed...');
  
  // GL Timber Beams - H3 GL15C Pine
  // Prices are per 2.4m length, converting to per L/M for flexible quoting
  const glBeams = [
    // 65mm width beams
    { name: '165x65 H3 GL15C Pine Beam', size: '165x65', length: 2.4, totalPrice: 243.84 },
    { name: '195x65 H3 GL15C Pine Beam', size: '195x65', length: 2.4, totalPrice: 281.28 },
    { name: '230x65 H3 GL15C Pine Beam', size: '230x65', length: 2.4, totalPrice: 317.40 },
    { name: '260x65 H3 GL15C Pine Beam', size: '260x65', length: 2.4, totalPrice: 374.16 },
    { name: '295x65 H3 GL15C Pine Beam', size: '295x65', length: 2.4, totalPrice: 402.48 },
    { name: '330x65 H3 GL15C Pine Beam', size: '330x65', length: 2.4, totalPrice: 445.08 },
    { name: '360x65 H3 GL15C Pine Beam', size: '360x65', length: 2.4, totalPrice: 509.52 },
    { name: '395x65 H3 GL15C Pine Beam', size: '395x65', length: 2.4, totalPrice: 559.80 },
    
    // 85mm width beams
    { name: '195x85 H3 GL15C Pine Beam', size: '195x85', length: 2.4, totalPrice: 352.20 },
    { name: '230x85 H3 GL15C Pine Beam', size: '230x85', length: 2.4, totalPrice: 410.16 },
    { name: '260x85 H3 GL15C Pine Beam', size: '260x85', length: 2.4, totalPrice: 452.88 },
    { name: '295x85 H3 GL15C Pine Beam', size: '295x85', length: 2.4, totalPrice: 488.88 },
    { name: '330x85 H3 GL15C Pine Beam', size: '330x85', length: 2.4, totalPrice: 553.44 },
    { name: '360x85 H3 GL15C Pine Beam', size: '360x85', length: 2.4, totalPrice: 687.60 },
    { name: '395x85 H3 GL15C Pine Beam', size: '395x85', length: 2.4, totalPrice: 750.84 },
  ];

  // Create materials with per L/M pricing
  let createdCount = 0;
  
  for (const beam of glBeams) {
    try {
      // Check if material already exists
      const existing = await db.material.findFirst({
        where: {
          name: beam.name,
          userId: userId
        }
      });

      if (!existing) {
        await db.material.create({
          data: {
            name: beam.name,
            description: `Glue Laminated Pine Beam ${beam.size}mm, H3 Treated, GL15C Grade`,
            sku: `GL-${beam.size}-H3`,
            supplier: 'Timber Supplier',
            unit: Unit.LM,
            pricePerUnit: parseFloat((beam.totalPrice / beam.length).toFixed(2)), // Convert to per meter
            gstInclusive: true,
            category: 'Structural Timber - GL Beams',
            inStock: true,
            userId,
          },
        });
        createdCount++;
      }
    } catch (error) {
      console.error(`Failed to create material: ${beam.name}`, error);
    }
  }

  // Also create entries for standard lengths if you often quote full lengths
  for (const beam of glBeams) {
    try {
      const existing = await db.material.findFirst({
        where: {
          name: `${beam.name} - 2.4m Length`,
          userId: userId
        }
      });

      if (!existing) {
        await db.material.create({
          data: {
            name: `${beam.name} - 2.4m Length`,
            description: `Glue Laminated Pine Beam ${beam.size}mm, H3 Treated, GL15C Grade - Full 2.4m Length`,
            sku: `GL-${beam.size}-H3-2400`,
            supplier: 'Timber Supplier',
            unit: Unit.EA,
            pricePerUnit: beam.totalPrice,
            gstInclusive: true,
            category: 'Structural Timber - GL Beams',
            inStock: true,
            userId,
          },
        });
        createdCount++;
      }
    } catch (error) {
      console.error(`Failed to create material: ${beam.name} - 2.4m Length`, error);
    }
  }

  console.log(`✅ Successfully created ${createdCount} GL Beam materials`);
  
  // Add more common materials here
  const commonMaterials = [
    // Framing Timber
    { name: '90x45 MGP10 Pine', unit: Unit.LM, price: 8.50, category: 'Framing Timber' },
    { name: '70x35 MGP10 Pine', unit: Unit.LM, price: 5.20, category: 'Framing Timber' },
    { name: '140x45 MGP10 Pine', unit: Unit.LM, price: 13.80, category: 'Framing Timber' },
    { name: '190x45 MGP10 Pine', unit: Unit.LM, price: 18.90, category: 'Framing Timber' },
    
    // Sheet Materials
    { name: 'Plywood Structural 17mm F11', unit: Unit.SQM, price: 65.00, category: 'Sheet Materials' },
    { name: 'Plywood Structural 12mm F11', unit: Unit.SQM, price: 45.00, category: 'Sheet Materials' },
    { name: 'Villaboard 6mm', unit: Unit.SQM, price: 28.50, category: 'Sheet Materials' },
    
    // Hardware
    { name: 'Joist Hanger 90x45', unit: Unit.EA, price: 3.50, category: 'Hardware' },
    { name: 'Joist Hanger 140x45', unit: Unit.EA, price: 5.20, category: 'Hardware' },
    { name: 'Triple Grip 100x10mm', unit: Unit.EA, price: 0.85, category: 'Fixings' },
    { name: 'Dynabolts M12x100', unit: Unit.EA, price: 2.20, category: 'Fixings' },
  ];

  for (const material of commonMaterials) {
    try {
      const existing = await db.material.findFirst({
        where: {
          name: material.name,
          userId: userId
        }
      });

      if (!existing) {
        await db.material.create({
          data: {
            name: material.name,
            unit: material.unit,
            pricePerUnit: material.price,
            category: material.category,
            supplier: 'Bunnings',
            gstInclusive: true,
            inStock: true,
            userId,
          },
        });
        createdCount++;
      }
    } catch (error) {
      console.error(`Failed to create material: ${material.name}`, error);
    }
  }

  console.log(`✅ Total materials created: ${createdCount}`);
}

// Main function to run the seed
async function main() {
  try {
    console.log('🚀 Starting materials database seed...');
    
    // Get the first user or create one
    const user = await db.user.findFirst();
    
    if (user) {
      await seedMaterials(user.id);
      console.log('✅ Materials database seeded successfully!');
    } else {
      console.log('❌ No user found. Please create a user first.');
      console.log('Run the app and sign in, then run this seed again.');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the seed
main()
  .then(() => {
    console.log('🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });