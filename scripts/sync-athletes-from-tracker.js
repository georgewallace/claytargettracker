const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function syncAthletes() {
  console.log('📊 Reading TournamentTracker-new.xlsx...\n');

  // Read the spreadsheet
  const workbook = XLSX.readFile('TournamentTracker-new.xlsx');
  const sheet = workbook.Sheets['Shooter History'];

  if (!sheet) {
    console.error('❌ Shooter History sheet not found!');
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`Found ${data.length} shooter records\n`);

  // Extract unique shooters
  const shootersMap = new Map();

  for (const row of data) {
    const shooterId = row['Shooter ID']?.toString().trim();
    const firstName = row['First Name']?.toString().trim();
    const lastName = row['Last Name']?.toString().trim();
    const skeetClass = row['Skeet Class']?.toString().trim();

    if (shooterId && firstName && lastName) {
      if (!shootersMap.has(shooterId)) {
        shootersMap.set(shooterId, {
          shooterId,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          nssaClass: skeetClass || null // Skeet uses NSSA classification
        });
      }
    }
  }

  console.log(`Found ${shootersMap.size} unique shooters\n`);
  console.log('Syncing to database...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [shooterId, shooterData] of shootersMap) {
    try {
      // Check if athlete exists with this shooter ID
      const existingAthlete = await prisma.athlete.findFirst({
        where: { shooterId },
        include: { user: true }
      });

      if (existingAthlete) {
        // Update with class data if we have it
        if (shooterData.nssaClass) {
          await prisma.athlete.update({
            where: { id: existingAthlete.id },
            data: { nssaClass: shooterData.nssaClass }
          });
          console.log(`✓ ${shooterData.name} (${shooterId}) - updated with class`);
          updated++;
        } else {
          console.log(`✓ ${shooterData.name} (${shooterId}) - already exists`);
          skipped++;
        }
        continue;
      }

      // Check if user exists with this name
      let user = await prisma.user.findFirst({
        where: { name: shooterData.name }
      });

      if (!user) {
        // Create placeholder user
        const email = `${shooterData.firstName.toLowerCase()}.${shooterData.lastName.toLowerCase()}@placeholder.local`;
        const password = await bcrypt.hash('ChangeMe123!', 10);

        user = await prisma.user.create({
          data: {
            email,
            name: shooterData.name,
            password,
            role: 'athlete'
          }
        });
      }

      // Check if athlete profile exists for this user
      const existingAthleteForUser = await prisma.athlete.findUnique({
        where: { userId: user.id }
      });

      if (existingAthleteForUser) {
        // Update with shooter ID and class
        await prisma.athlete.update({
          where: { id: existingAthleteForUser.id },
          data: {
            shooterId,
            nssaClass: shooterData.nssaClass
          }
        });
        console.log(`✓ ${shooterData.name} (${shooterId}) - updated with shooter ID and class`);
        updated++;
      } else {
        // Create athlete profile
        await prisma.athlete.create({
          data: {
            userId: user.id,
            shooterId,
            nssaClass: shooterData.nssaClass,
            isActive: true
          }
        });
        console.log(`✓ ${shooterData.name} (${shooterId}) - created`);
        created++;
      }

    } catch (error) {
      console.error(`❌ Error processing ${shooterData.name}: ${error.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${shootersMap.size}\n`);

  await prisma.$disconnect();
}

syncAthletes().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
