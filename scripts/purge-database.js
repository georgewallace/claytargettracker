const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeDatabase() {
  console.log('🗑️  Starting database purge...\n');

  try {
    // Find the admin user to keep
    const adminUser = await prisma.user.findUnique({
      where: { email: 'gvwallace@live.com' }
    });

    if (!adminUser) {
      console.error('❌ Admin user gvwallace@live.com not found!');
      console.log('Cannot purge database without preserving admin user.');
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);
    console.log(`   User ID: ${adminUser.id}\n`);

    // Delete in order to respect foreign key constraints
    console.log('Deleting data...');

    // 1. Delete shoot-off related data
    const shootOffScores = await prisma.shootOffScore.deleteMany({});
    console.log(`✓ Deleted ${shootOffScores.count} shoot-off scores`);

    const shootOffRounds = await prisma.shootOffRound.deleteMany({});
    console.log(`✓ Deleted ${shootOffRounds.count} shoot-off rounds`);

    const shootOffParticipants = await prisma.shootOffParticipant.deleteMany({});
    console.log(`✓ Deleted ${shootOffParticipants.count} shoot-off participants`);

    const shootOffs = await prisma.shootOff.deleteMany({});
    console.log(`✓ Deleted ${shootOffs.count} shoot-offs`);

    // 2. Delete scores
    const scores = await prisma.score.deleteMany({});
    console.log(`✓ Deleted ${scores.count} scores`);

    // 3. Delete shoots
    const shoots = await prisma.shoot.deleteMany({});
    console.log(`✓ Deleted ${shoots.count} shoots`);

    // 4. Delete imported scores
    const importedScores = await prisma.importedScore.deleteMany({});
    console.log(`✓ Deleted ${importedScores.count} imported scores`);

    // 5. Delete squad members
    const squadMembers = await prisma.squadMember.deleteMany({});
    console.log(`✓ Deleted ${squadMembers.count} squad members`);

    // 6. Delete squads
    const squads = await prisma.squad.deleteMany({});
    console.log(`✓ Deleted ${squads.count} squads`);

    // 7. Delete time slot preferences
    const timeSlotPreferences = await prisma.timeSlotPreference.deleteMany({});
    console.log(`✓ Deleted ${timeSlotPreferences.count} time slot preferences`);

    // 8. Delete time slots
    const timeSlots = await prisma.timeSlot.deleteMany({});
    console.log(`✓ Deleted ${timeSlots.count} time slots`);

    // 9. Delete registration disciplines
    const registrationDisciplines = await prisma.registrationDiscipline.deleteMany({});
    console.log(`✓ Deleted ${registrationDisciplines.count} registration disciplines`);

    // 10. Delete registrations
    const registrations = await prisma.registration.deleteMany({});
    console.log(`✓ Deleted ${registrations.count} registrations`);

    // 11. Delete tournament disciplines
    const tournamentDisciplines = await prisma.tournamentDiscipline.deleteMany({});
    console.log(`✓ Deleted ${tournamentDisciplines.count} tournament disciplines`);

    // 12. Delete team tournament registrations
    const teamRegistrations = await prisma.teamTournamentRegistration.deleteMany({});
    console.log(`✓ Deleted ${teamRegistrations.count} team tournament registrations`);

    // 13. Delete tournaments (except those created by admin)
    const tournaments = await prisma.tournament.deleteMany({
      where: {
        createdById: {
          not: adminUser.id
        }
      }
    });
    console.log(`✓ Deleted ${tournaments.count} tournaments (kept admin's tournaments)`);

    // Delete admin's tournaments too
    const adminTournaments = await prisma.tournament.deleteMany({
      where: {
        createdById: adminUser.id
      }
    });
    console.log(`✓ Deleted ${adminTournaments.count} admin tournaments`);

    // 14. Delete athlete averages
    const athleteAverages = await prisma.athleteAverage.deleteMany({});
    console.log(`✓ Deleted ${athleteAverages.count} athlete averages`);

    // 15. Delete team join requests
    const joinRequests = await prisma.teamJoinRequest.deleteMany({});
    console.log(`✓ Deleted ${joinRequests.count} team join requests`);

    // 16. Delete team coaches
    const teamCoaches = await prisma.teamCoach.deleteMany({
      where: {
        userId: {
          not: adminUser.id
        }
      }
    });
    console.log(`✓ Deleted ${teamCoaches.count} team coach relationships`);

    // Delete admin's coach relationships too
    const adminCoachRelations = await prisma.teamCoach.deleteMany({
      where: {
        userId: adminUser.id
      }
    });
    console.log(`✓ Deleted ${adminCoachRelations.count} admin coach relationships`);

    // 17. Delete athletes (except admin's if exists)
    const athletes = await prisma.athlete.deleteMany({
      where: {
        userId: {
          not: adminUser.id
        }
      }
    });
    console.log(`✓ Deleted ${athletes.count} athletes`);

    // Delete admin's athlete profile if exists
    const adminAthlete = await prisma.athlete.deleteMany({
      where: {
        userId: adminUser.id
      }
    });
    console.log(`✓ Deleted ${adminAthlete.count} admin athlete profile (if existed)`);

    // 18. Delete teams
    const teams = await prisma.team.deleteMany({});
    console.log(`✓ Deleted ${teams.count} teams`);

    // 19. Delete all users except admin
    const users = await prisma.user.deleteMany({
      where: {
        id: {
          not: adminUser.id
        }
      }
    });
    console.log(`✓ Deleted ${users.count} users (kept admin)`);

    console.log('\n✨ Database purge completed successfully!');
    console.log(`\n📊 Remaining data:`);
    console.log(`   - 1 admin user: ${adminUser.email}`);
    console.log(`   - All other data has been removed\n`);

  } catch (error) {
    console.error('\n❌ Error during purge:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will DELETE ALL DATA except the admin user!\n');
console.log('Admin user to keep: gvwallace@live.com\n');
console.log('This action cannot be undone!\n');

// Check if running with --confirm flag
if (process.argv.includes('--confirm')) {
  purgeDatabase();
} else {
  console.log('To proceed, run this command with --confirm flag:');
  console.log('  node scripts/purge-database.js --confirm\n');
  process.exit(0);
}
