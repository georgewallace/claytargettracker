const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking database...\n');
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    console.log(`Users: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true, createdById: true }
    });
    console.log(`\nTournaments: ${tournaments.length}`);
    tournaments.forEach(t => console.log(`  - ${t.name} (created by: ${t.createdById})`));

    const athletes = await prisma.athlete.count();
    console.log(`\nAthletes: ${athletes}`);

    const teams = await prisma.team.count();
    console.log(`Teams: ${teams}`);

    const registrations = await prisma.registration.count();
    console.log(`Registrations: ${registrations}`);

    const scores = await prisma.score.count();
    console.log(`Scores: ${scores}`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
