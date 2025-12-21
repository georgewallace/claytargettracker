const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClasses() {
  console.log('📊 Checking athlete class assignments...\n');

  const athletes = await prisma.athlete.findMany({
    include: {
      user: true
    },
    orderBy: {
      shooterId: 'asc'
    }
  });

  console.log(`Total athletes: ${athletes.length}\n`);

  let nscaCount = 0;
  let ataCount = 0;
  let nssaCount = 0;
  let noClassCount = 0;

  console.log('Sample athletes:\n');
  athletes.slice(0, 10).forEach(athlete => {
    console.log(`${athlete.user.name} (${athlete.shooterId}):`);
    console.log(`  NSCA: ${athlete.nscaClass || 'none'}`);
    console.log(`  ATA:  ${athlete.ataClass || 'none'}`);
    console.log(`  NSSA: ${athlete.nssaClass || 'none'}`);
    console.log('');

    if (athlete.nscaClass) nscaCount++;
    if (athlete.ataClass) ataCount++;
    if (athlete.nssaClass) nssaCount++;
    if (!athlete.nscaClass && !athlete.ataClass && !athlete.nssaClass) noClassCount++;
  });

  console.log('Summary:');
  console.log(`  Athletes with NSCA class: ${nscaCount}`);
  console.log(`  Athletes with ATA class:  ${ataCount}`);
  console.log(`  Athletes with NSSA class: ${nssaCount}`);
  console.log(`  Athletes with no classes: ${noClassCount}\n`);

  await prisma.$disconnect();
}

checkClasses();
