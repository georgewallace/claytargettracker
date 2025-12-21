const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeDatabase() {
  console.log('🗑️  Starting COMPLETE database purge...\n');
  console.log('⚠️  This will DELETE ALL DATA including all users!\n');

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting data...\n');

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

    // 13. Delete ALL tournaments
    const tournaments = await prisma.tournament.deleteMany({});
    console.log(`✓ Deleted ${tournaments.count} tournaments`);

    // 14. Delete athlete averages
    const athleteAverages = await prisma.athleteAverage.deleteMany({});
    console.log(`✓ Deleted ${athleteAverages.count} athlete averages`);

    // 15. Delete team join requests
    const joinRequests = await prisma.teamJoinRequest.deleteMany({});
    console.log(`✓ Deleted ${joinRequests.count} team join requests`);

    // 16. Delete ALL team coaches
    const teamCoaches = await prisma.teamCoach.deleteMany({});
    console.log(`✓ Deleted ${teamCoaches.count} team coach relationships`);

    // 17. Delete ALL athletes
    const athletes = await prisma.athlete.deleteMany({});
    console.log(`✓ Deleted ${athletes.count} athletes`);

    // 18. Delete ALL teams
    const teams = await prisma.team.deleteMany({});
    console.log(`✓ Deleted ${teams.count} teams`);

    // 19. Delete ALL users
    const users = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${users.count} users`);

    console.log('\n✨ Database completely purged!');
    console.log(`\n📊 All data has been removed\n`);

  } catch (error) {
    console.error('\n❌ Error during purge:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will DELETE ALL DATA including ALL USERS!\n');
console.log('This action cannot be undone!!\n');

// Check if running with --confirm flag
if (process.argv.includes('--confirm')) {
  purgeDatabase();
} else {
  console.log('To proceed, run this command with --confirm flag:');
  console.log('  node scripts/purge-database-complete.js --confirm\n');
  process.exit(0);
}
