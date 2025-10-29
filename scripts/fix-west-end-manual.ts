import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixWestEndManually() {
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
    console.log(`   ID: ${tournament.id}\n`)

    // Update Skeet and Trap to 4 rounds
    for (const td of tournament.disciplines) {
      const discipline = td.discipline
      
      if (discipline.name === 'skeet' || discipline.name === 'trap') {
        console.log(`📋 Updating ${discipline.displayName}:`)
        console.log(`   Current: ${td.rounds} round(s)`)
        
        await prisma.tournamentDiscipline.update({
          where: {
            id: td.id
          },
          data: {
            rounds: 4
          }
        })
        
        console.log(`   ✅ Updated to: 4 rounds\n`)
      }
    }

    console.log('✅ Fix complete! Please refresh the page.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixWestEndManually()

