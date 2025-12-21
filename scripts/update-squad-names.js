const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSquadNames() {
  try {
    // Get all squads with their members and related data
    const squads = await prisma.squad.findMany({
      include: {
        timeSlot: {
          include: {
            tournament: true,
            discipline: true
          }
        },
        members: {
          include: {
            athlete: {
              include: {
                team: true,
                user: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${squads.length} squads to process\n`);

    let updatedCount = 0;

    for (const squad of squads) {
      if (squad.members.length === 0) {
        console.log(`⊘ Skipping "${squad.name}" (empty squad)`);
        continue;
      }

      // Get unique teams from squad members
      const teams = squad.members
        .map(m => m.athlete.team)
        .filter(team => team !== null);

      const uniqueTeamIds = [...new Set(teams.map(t => t.id))];

      // Get divisions from squad members
      const divisions = squad.members
        .map(m => m.athlete.division)
        .filter(Boolean);

      // Check if all divisions are the same
      const uniqueDivisions = [...new Set(divisions)];
      const dominantDivision = uniqueDivisions.length === 1 && uniqueDivisions[0]
        ? uniqueDivisions[0]
        : null;

      let newName;

      // Determine new name based on team composition
      if (uniqueTeamIds.length > 1) {
        // Mixed team squad
        let divisionSuffix = 'Mixed';
        if (dominantDivision) {
          // All athletes have the same division
          divisionSuffix = dominantDivision;
        } else if (uniqueDivisions.length > 1) {
          // Mixed divisions (Varsity, JV, Novice, etc.)
          divisionSuffix = 'Mixed Division';
        }
        newName = `Mixed Team - ${divisionSuffix}`;
      } else if (uniqueTeamIds.length === 1) {
        // Single team squad
        const teamName = teams[0].name;
        // Use division if available, otherwise use tournament name
        const suffix = dominantDivision || squad.timeSlot.tournament.name;
        newName = `${teamName} - ${suffix}`;
      } else {
        // Unaffiliated athletes
        const divisionSuffix = dominantDivision || 'Open';
        newName = `Unaffiliated - ${divisionSuffix}`;
      }

      // Only update if name has changed
      if (squad.name !== newName) {
        await prisma.squad.update({
          where: { id: squad.id },
          data: { name: newName }
        });

        console.log(`✅ Updated: "${squad.name}" → "${newName}"`);
        console.log(`   Members: ${squad.members.map(m => m.athlete.user.name).join(', ')}`);
        console.log(`   Teams: ${uniqueTeamIds.length === 0 ? 'None' : uniqueTeamIds.length === 1 ? teams[0].name : 'Mixed'}`);
        console.log('');
        updatedCount++;
      } else {
        console.log(`✓ No change needed: "${squad.name}"`);
      }
    }

    console.log(`\n✅ Complete! Updated ${updatedCount} out of ${squads.length} squads`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSquadNames();
