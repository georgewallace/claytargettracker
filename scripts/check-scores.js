const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkScores() {
  try {
    // Find Test tourney
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'Test tourney',
          mode: 'insensitive'
        }
      }
    })

    if (!tournament) {
      console.log('Tournament "Test tourney" not found')
      return
    }

    console.log(`Found tournament: ${tournament.name} (ID: ${tournament.id})`)

    // Find skeet discipline
    const skeetDiscipline = await prisma.discipline.findFirst({
      where: {
        name: 'skeet'
      }
    })

    if (!skeetDiscipline) {
      console.log('Skeet discipline not found')
      return
    }

    // Count shoots (which contain scores)
    const shootCount = await prisma.shoot.count({
      where: {
        tournamentId: tournament.id,
        disciplineId: skeetDiscipline.id
      }
    })

    console.log(`\nSkeet shoots for "${tournament.name}": ${shootCount}`)

    // Get detailed shoot information
    const shoots = await prisma.shoot.findMany({
      where: {
        tournamentId: tournament.id,
        disciplineId: skeetDiscipline.id
      },
      include: {
        athlete: {
          include: {
            user: true
          }
        },
        scores: true
      }
    })

    console.log(`\nDetailed breakdown:`)
    shoots.forEach((shoot, index) => {
      console.log(`  ${index + 1}. ${shoot.athlete.user.name} - ${shoot.scores.length} score entries`)
    })

    // Also check if they mean "scores" as in Score records
    const scoreCount = await prisma.score.count({
      where: {
        shoot: {
          tournamentId: tournament.id,
          disciplineId: skeetDiscipline.id
        }
      }
    })

    console.log(`\nTotal Score records (individual rounds/stations): ${scoreCount}`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkScores()
