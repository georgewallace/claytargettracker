const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Classification options
const CLASSES = ['A', 'B', 'C', 'D', 'E'];

// Helper to get a random class
function getRandomClass() {
  return CLASSES[Math.floor(Math.random() * CLASSES.length)];
}

async function assignClasses() {
  try {
    // Get all athletes
    const athletes = await prisma.athlete.findMany({
      include: {
        user: true
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    console.log(`Found ${athletes.length} athletes`);

    let updatedCount = 0;

    for (const athlete of athletes) {
      const updates = {};

      // Assign NSCA class if missing
      if (!athlete.nscaClass) {
        updates.nscaClass = getRandomClass();
      }

      // Assign ATA class if missing
      if (!athlete.ataClass) {
        updates.ataClass = getRandomClass();
      }

      // Assign NSSA class if missing
      if (!athlete.nssaClass) {
        updates.nssaClass = getRandomClass();
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.athlete.update({
          where: { id: athlete.id },
          data: updates
        });

        console.log(`✅ Updated ${athlete.user.name}:`, updates);
        updatedCount++;
      } else {
        console.log(`✓ ${athlete.user.name} already has all classes assigned`);
      }
    }

    console.log(`\n✅ Complete! Updated ${updatedCount} out of ${athletes.length} athletes`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignClasses();
