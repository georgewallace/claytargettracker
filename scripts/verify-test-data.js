const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyTestData() {
  try {
    console.log('Verifying test data in database...\n')

    // Check teams
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: 'Eagle Ridge' } },
          { name: { contains: 'Valley View' } }
        ]
      }
    })

    console.log('=== TEAMS ===')
    teams.forEach(team => {
      console.log(`\nTeam: ${team.name}`)
      console.log(`  Head Coach: ${team.headCoach || 'MISSING'}`)
      console.log(`  Email: ${team.headCoachEmail || 'MISSING'}`)
      console.log(`  Phone: ${team.headCoachPhone || 'MISSING'}`)
      console.log(`  Address: ${team.address || 'MISSING'}`)
      console.log(`  City: ${team.city || 'MISSING'}`)
      console.log(`  State: ${team.state || 'MISSING'}`)
      console.log(`  ZIP: ${team.zip || 'MISSING'}`)
    })

    // Check athletes
    const athletes = await prisma.athlete.findMany({
      where: {
        shooterId: {
          startsWith: '25-'
        }
      },
      include: {
        user: true,
        team: true
      }
    })

    console.log('\n\n=== ATHLETES ===')
    athletes.forEach(athlete => {
      console.log(`\nAthlete: ${athlete.user.name}`)
      console.log(`  Shooter ID: ${athlete.shooterId || 'MISSING'}`)
      console.log(`  First Name: ${athlete.user.firstName || 'MISSING'}`)
      console.log(`  Last Name: ${athlete.user.lastName || 'MISSING'}`)
      console.log(`  Phone: ${athlete.user.phone || 'MISSING'}`)
      console.log(`  Email: ${athlete.user.email || 'MISSING'}`)
      console.log(`  Gender: ${athlete.gender || 'MISSING'}`)
      console.log(`  Grade: ${athlete.grade || 'MISSING'}`)
      console.log(`  Division: ${athlete.division || 'MISSING'}`)
      console.log(`  Team: ${athlete.team?.name || 'MISSING'}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyTestData()
