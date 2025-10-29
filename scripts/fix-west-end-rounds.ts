import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixWestEndTournament() {
  try {
    // Find West End Tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'West End'
        }
      },
      include: {
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    })

    if (!tournament) {
      console.log('❌ West End Tournament not found')
      return
    }

    console.log(`✅ Found tournament: ${tournament.name}`)
    console.log(`   ID: ${tournament.id}`)
    console.log(`   Status: ${tournament.status}`)
    console.log('\nCurrent discipline configurations:')

    // Check each discipline for actual score data
    for (const td of tournament.disciplines) {
      const discipline = td.discipline
      console.log(`\n📋 ${discipline.displayName}:`)
      console.log(`   Configured: ${td.rounds || td.targets || td.stations} ${td.rounds ? 'rounds' : 'targets/stations'}`)

      // Count actual score records
      const shoots = await prisma.shoot.findMany({
        where: {
          tournamentId: tournament.id,
          disciplineId: discipline.id
        },
        include: {
          scores: {
            orderBy: {
              station: 'desc'
            },
            take: 1 // Get highest station number
          }
        }
      })

      if (shoots.length > 0 && shoots[0].scores.length > 0) {
        const maxStation = shoots[0].scores[0].station
        console.log(`   Actual max station: ${maxStation}`)

        // Calculate actual rounds based on discipline
        if (discipline.name === 'trap' || discipline.name === 'skeet') {
          const stationsPerRound = discipline.name === 'trap' ? 5 : 8
          const actualRounds = Math.ceil(maxStation / stationsPerRound)
          console.log(`   Actual rounds: ${actualRounds}`)

          if (actualRounds !== td.rounds) {
            console.log(`   ⚠️  MISMATCH! Should be ${actualRounds} rounds, but configured as ${td.rounds}`)

            // Update the configuration
            await prisma.tournamentDiscipline.update({
              where: {
                id: td.id
              },
              data: {
                rounds: actualRounds
              }
            })

            console.log(`   ✅ Updated to ${actualRounds} rounds`)
          }
        }
      }
    }

    console.log('\n✅ Fix complete!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixWestEndTournament()

