const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteScores() {
  try {
    // Find Test tourney
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'Test tourney'
        }
      }
    })

    if (!tournament) {
      console.log('Tournament "Test tourney" not found')
      return
    }

    console.log(`Found tournament: ${tournament.name} (ID: ${tournament.id})`)

    // First, delete all Score records for shoots in this tournament
    const deleteScores = await prisma.score.deleteMany({
      where: {
        shoot: {
          tournamentId: tournament.id
        }
      }
    })

    console.log(`Deleted ${deleteScores.count} Score records`)

    // Then delete all Shoot records for this tournament
    const deleteShoots = await prisma.shoot.deleteMany({
      where: {
        tournamentId: tournament.id
      }
    })

    console.log(`Deleted ${deleteShoots.count} Shoot records`)
    console.log(`\n✓ All scores deleted from "${tournament.name}"`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

deleteScores()
