/**
 * Export data from staging database to JSON file
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.STAGING_DATABASE_URL }
  }
})

async function main() {
  console.log('🚀 Exporting data from staging database...\n')

  try {
    const data: any = {}

    console.log('📋 Fetching Disciplines...')
    data.disciplines = await prisma.discipline.findMany()

    console.log('👥 Fetching Users...')
    data.users = await prisma.user.findMany()

    console.log('🏆 Fetching Teams...')
    data.teams = await prisma.team.findMany()

    console.log('👨‍🏫 Fetching Team Coaches...')
    data.teamCoaches = await prisma.teamCoach.findMany()

    console.log('🎯 Fetching Shooters...')
    data.shooters = await prisma.shooter.findMany()

    console.log('🏅 Fetching Tournaments...')
    data.tournaments = await prisma.tournament.findMany()

    console.log('📋 Fetching Tournament Disciplines...')
    data.tournamentDisciplines = await prisma.tournamentDiscipline.findMany()

    console.log('⏰ Fetching Time Slots...')
    data.timeSlots = await prisma.timeSlot.findMany()

    console.log('👥 Fetching Squads...')
    data.squads = await prisma.squad.findMany()

    console.log('🎯 Fetching Squad Members...')
    data.squadMembers = await prisma.squadMember.findMany()

    console.log('📝 Fetching Registrations...')
    data.registrations = await prisma.registration.findMany()

    console.log('📋 Fetching Registration Disciplines...')
    data.registrationDisciplines = await prisma.registrationDiscipline.findMany()

    console.log('🎯 Fetching Shoots...')
    data.shoots = await prisma.shoot.findMany()

    console.log('📊 Fetching Scores...')
    data.scores = await prisma.score.findMany()

    console.log('📊 Fetching Shooter Averages...')
    data.shooterAverages = await prisma.shooterAverage.findMany()

    console.log('📨 Fetching Team Join Requests...')
    data.teamJoinRequests = await prisma.teamJoinRequest.findMany()

    // Write to file
    const filename = 'staging-data-export.json'
    writeFileSync(filename, JSON.stringify(data, null, 2))

    console.log('\n✅ Data exported successfully!')
    console.log(`📁 Saved to: ${filename}\n`)
    console.log('📊 Summary:')
    console.log(`   - ${data.disciplines.length} disciplines`)
    console.log(`   - ${data.users.length} users`)
    console.log(`   - ${data.teams.length} teams`)
    console.log(`   - ${data.teamCoaches.length} team coaches`)
    console.log(`   - ${data.shooters.length} shooters`)
    console.log(`   - ${data.tournaments.length} tournaments`)
    console.log(`   - ${data.tournamentDisciplines.length} tournament disciplines`)
    console.log(`   - ${data.timeSlots.length} time slots`)
    console.log(`   - ${data.squads.length} squads`)
    console.log(`   - ${data.squadMembers.length} squad members`)
    console.log(`   - ${data.registrations.length} registrations`)
    console.log(`   - ${data.registrationDisciplines.length} registration disciplines`)
    console.log(`   - ${data.shoots.length} shoots`)
    console.log(`   - ${data.scores.length} scores`)
    console.log(`   - ${data.shooterAverages.length} shooter averages`)
    console.log(`   - ${data.teamJoinRequests.length} team join requests`)

  } catch (error) {
    console.error('❌ Error exporting data:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

