/**
 * Copy ALL data from local database to staging
 * This includes tournaments, teams, shooters, registrations, scores, etc.
 */

import { PrismaClient } from '@prisma/client'

// Local database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Staging database
const stagingPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.STAGING_DATABASE_URL
    }
  }
})

async function main() {
  console.log('🚀 Copying ALL data from local to staging...\n')

  try {
    // 1. Copy Disciplines (if not exist)
    console.log('📋 Step 1: Copying Disciplines...')
    const localDisciplines = await localPrisma.discipline.findMany()
    for (const disc of localDisciplines) {
      await stagingPrisma.discipline.upsert({
        where: { id: disc.id },
        update: disc,
        create: disc
      })
    }
    console.log(`✅ Copied ${localDisciplines.length} disciplines\n`)

    // 2. Copy Users
    console.log('👥 Step 2: Copying Users...')
    const localUsers = await localPrisma.user.findMany()
    for (const user of localUsers) {
      await stagingPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`✅ Copied ${localUsers.length} users\n`)

    // 3. Copy Teams
    console.log('🏆 Step 3: Copying Teams...')
    const localTeams = await localPrisma.team.findMany()
    for (const team of localTeams) {
      await stagingPrisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team
      })
    }
    console.log(`✅ Copied ${localTeams.length} teams\n`)

    // 4. Copy Shooters
    console.log('🎯 Step 4: Copying Shooters...')
    const localShooters = await localPrisma.shooter.findMany()
    for (const shooter of localShooters) {
      await stagingPrisma.shooter.upsert({
        where: { id: shooter.id },
        update: shooter,
        create: shooter
      })
    }
    console.log(`✅ Copied ${localShooters.length} shooters\n`)

    // 5. Copy Tournaments
    console.log('🏅 Step 5: Copying Tournaments...')
    const localTournaments = await localPrisma.tournament.findMany({
      include: {
        disciplines: true
      }
    })
    
    for (const tournament of localTournaments) {
      // First, upsert the tournament without disciplines
      const { disciplines, ...tournamentData } = tournament
      await stagingPrisma.tournament.upsert({
        where: { id: tournament.id },
        update: tournamentData,
        create: tournamentData
      })

      // Then handle disciplines
      for (const td of disciplines) {
        await stagingPrisma.tournamentDiscipline.upsert({
          where: { id: td.id },
          update: {
            disciplineId: td.disciplineId,
            rounds: td.rounds,
            targets: td.targets,
            stations: td.stations
          },
          create: {
            id: td.id,
            tournamentId: td.tournamentId,
            disciplineId: td.disciplineId,
            rounds: td.rounds,
            targets: td.targets,
            stations: td.stations
          }
        })
      }
    }
    console.log(`✅ Copied ${localTournaments.length} tournaments\n`)

    // 6. Copy Time Slots
    console.log('⏰ Step 6: Copying Time Slots...')
    const localTimeSlots = await localPrisma.timeSlot.findMany()
    for (const slot of localTimeSlots) {
      await stagingPrisma.timeSlot.upsert({
        where: { id: slot.id },
        update: slot,
        create: slot
      })
    }
    console.log(`✅ Copied ${localTimeSlots.length} time slots\n`)

    // 7. Copy Squads
    console.log('👥 Step 7: Copying Squads...')
    const localSquads = await localPrisma.squad.findMany()
    for (const squad of localSquads) {
      await stagingPrisma.squad.upsert({
        where: { id: squad.id },
        update: squad,
        create: squad
      })
    }
    console.log(`✅ Copied ${localSquads.length} squads\n`)

    // 8. Copy Squad Members
    console.log('🎯 Step 8: Copying Squad Members...')
    const localSquadMembers = await localPrisma.squadMember.findMany()
    for (const member of localSquadMembers) {
      await stagingPrisma.squadMember.upsert({
        where: { id: member.id },
        update: member,
        create: member
      })
    }
    console.log(`✅ Copied ${localSquadMembers.length} squad members\n`)

    // 9. Copy Registrations
    console.log('📝 Step 9: Copying Registrations...')
    const localRegistrations = await localPrisma.registration.findMany()
    for (const reg of localRegistrations) {
      await stagingPrisma.registration.upsert({
        where: { id: reg.id },
        update: reg,
        create: reg
      })
    }
    console.log(`✅ Copied ${localRegistrations.length} registrations\n`)

    // 10. Copy Registration Disciplines
    console.log('📋 Step 10: Copying Registration Disciplines...')
    const localRegDisc = await localPrisma.registrationDiscipline.findMany()
    for (const rd of localRegDisc) {
      await stagingPrisma.registrationDiscipline.upsert({
        where: { id: rd.id },
        update: rd,
        create: rd
      })
    }
    console.log(`✅ Copied ${localRegDisc.length} registration disciplines\n`)

    // 11. Copy Shoots (Scores)
    console.log('🎯 Step 11: Copying Shoots (Scores)...')
    const localShoots = await localPrisma.shoot.findMany()
    for (const shoot of localShoots) {
      await stagingPrisma.shoot.upsert({
        where: { id: shoot.id },
        update: shoot,
        create: shoot
      })
    }
    console.log(`✅ Copied ${localShoots.length} shoots\n`)

    // 12. Copy Team Join Requests
    console.log('📨 Step 12: Copying Team Join Requests...')
    const localRequests = await localPrisma.teamJoinRequest.findMany()
    for (const req of localRequests) {
      await stagingPrisma.teamJoinRequest.upsert({
        where: { id: req.id },
        update: req,
        create: req
      })
    }
    console.log(`✅ Copied ${localRequests.length} team join requests\n`)

    console.log('🎉 SUCCESS! All data copied to staging!\n')
    console.log('📊 Summary:')
    console.log(`   - ${localDisciplines.length} disciplines`)
    console.log(`   - ${localUsers.length} users`)
    console.log(`   - ${localTeams.length} teams`)
    console.log(`   - ${localShooters.length} shooters`)
    console.log(`   - ${localTournaments.length} tournaments`)
    console.log(`   - ${localTimeSlots.length} time slots`)
    console.log(`   - ${localSquads.length} squads`)
    console.log(`   - ${localSquadMembers.length} squad members`)
    console.log(`   - ${localRegistrations.length} registrations`)
    console.log(`   - ${localShoots.length} shoots`)
    console.log(`   - ${localRequests.length} team join requests`)

  } catch (error) {
    console.error('❌ Error copying data:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await localPrisma.$disconnect()
    await stagingPrisma.$disconnect()
  })

