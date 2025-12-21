const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

async function assignShooterIds() {
  try {
    // Get all athletes
    const athletes = await prisma.athlete.findMany({
      include: {
        user: true,
        team: true
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    console.log(`Found ${athletes.length} athletes`);

    // Assign shooter IDs starting from 25-1001
    let shooterIdNum = 1001;
    const updates = [];

    for (const athlete of athletes) {
      const shooterId = `25-${shooterIdNum}`;

      await prisma.athlete.update({
        where: { id: athlete.id },
        data: { shooterId }
      });

      updates.push({
        athleteId: athlete.id,
        name: athlete.user.name,
        shooterId,
        team: athlete.team?.name || 'No Team',
        nscaClass: athlete.nscaClass,
        ataClass: athlete.ataClass,
        nssaClass: athlete.nssaClass
      });

      shooterIdNum++;
    }

    console.log('\nShooter IDs assigned:');
    updates.forEach(u => {
      console.log(`  ${u.shooterId}: ${u.name} (${u.team})`);
    });

    // Create Excel file with sample scores
    console.log('\n\nCreating Excel file with sample scores...');

    const excelData = updates.map((athlete, index) => {
      // Generate some random sample scores
      const skeetEvent = 'Y';
      const trapEvent = index % 2 === 0 ? 'Y' : ''; // Every other athlete shoots trap
      const sportingEvent = index % 3 === 0 ? 'Y' : ''; // Every third athlete shoots sporting

      const row = {
        'Shooter ID': athlete.shooterId,
        'First Name': athlete.name.split(' ')[0],
        'Last Name': athlete.name.split(' ').slice(1).join(' '),
        'Team': athlete.team,
        'Skeet Event': skeetEvent,
        'Trap Event': trapEvent,
        'Sporting Event': sportingEvent
      };

      // Skeet scores (4 rounds)
      if (skeetEvent === 'Y') {
        const baseScore = 20 + Math.floor(Math.random() * 5); // Random score between 20-24
        row['Round 1'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
        row['Round 2'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
        row['Round 3'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
        row['Round 4'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
      }

      // Trap scores (4 rounds)
      if (trapEvent === 'Y') {
        const baseScore = 20 + Math.floor(Math.random() * 5);
        row['Trap Round 1'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
        row['Trap Round 2'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
        row['Trap Round 3'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
        row['Trap Round 4'] = Math.min(25, baseScore + Math.floor(Math.random() * 3));
      }

      // Sporting Clays scores (20 stations)
      if (sportingEvent === 'Y') {
        for (let i = 1; i <= 20; i++) {
          row[`Station ${i}`] = Math.floor(Math.random() * 11); // Random score 0-10
        }
      }

      return row;
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Shooter ID
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Team
      { wch: 12 }, // Skeet Event
      { wch: 12 }, // Trap Event
      { wch: 15 }, // Sporting Event
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Tournament List');

    // Write file
    const fileName = '/Users/georgewallace/elastic-repos/claytargettracker/TestScores.xlsx';
    XLSX.writeFile(wb, fileName);

    console.log(`\n✅ Excel file created: ${fileName}`);
    console.log('\nYou can now use this file to test the import functionality!');
    console.log('The file includes:');
    console.log('  - All athletes with their Shooter IDs');
    console.log('  - Sample Skeet scores (all athletes)');
    console.log('  - Sample Trap scores (every other athlete)');
    console.log('  - Sample Sporting Clays scores (every third athlete)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignShooterIds();
