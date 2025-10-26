/**
 * Copy ALL data from staging database to local
 * This includes tournaments, teams, shooters, registrations, scores, etc.
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'

// Load environment variables
config({ path: '.env.local' })

// We'll use a two-step approach:
// 1. Export from staging (PostgreSQL) to JSON
// 2. Import to local (SQLite)

const stagingUrl = process.env.STAGING_DATABASE_URL
const localUrl = process.env.DATABASE_URL

if (!stagingUrl || !localUrl) {
  console.error('❌ Missing database URLs in environment')
  process.exit(1)
}

// Connect to staging with explicit URL
const stagingPrisma = new PrismaClient({
  datasources: {
    db: { url: stagingUrl }
  }
})

async function main() {
  console.log('🚀 Copying ALL data from staging to local...\n')

  try {
    // 1. Copy Disciplines (if not exist)
    console.log('📋 Step 1: Copying Disciplines...')
    const stagingDisciplines = await stagingPrisma.discipline.findMany()
    for (const disc of stagingDisciplines) {
      await localPrisma.discipline.upsert({
        where: { id: disc.id },
        update: disc,
        create: disc
      })
    }
    console.log(`✅ Copied ${stagingDisciplines.length} disciplines\n`)

    // 2. Copy Users
    console.log('👥 Step 2: Copying Users...')
    const stagingUsers = await stagingPrisma.user.findMany()
    for (const user of stagingUsers) {
      await localPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`✅ Copied ${stagingUsers.length} users\n`)

    // 3. Copy Teams
    console.log('🏆 Step 3: Copying Teams...')
    const stagingTeams = await stagingPrisma.team.findMany()
    for (const team of stagingTeams) {
      await localPrisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team
      })
    }
    console.log(`✅ Copied ${stagingTeams.length} teams\n`)

    // 4. Copy Team Coaches
    console.log('👨‍🏫 Step 4: Copying Team Coaches...')
    const stagingCoaches = await stagingPrisma.teamCoach.findMany()
    for (const coach of stagingCoaches) {
      await localPrisma.teamCoach.upsert({
        where: { id: coach.id },
        update: coach,
        create: coach
      })
    }
    console.log(`✅ Copied ${stagingCoaches.length} team coaches\n`)

    // 5. Copy Shooters
    console.log('🎯 Step 5: Copying Shooters...')
    const stagingShooters = await stagingPrisma.shooter.findMany()
    for (const shooter of stagingShooters) {
      await localPrisma.shooter.upsert({
        where: { id: shooter.id },
        update: shooter,
        create: shooter
      })
    }
    console.log(`✅ Copied ${stagingShooters.length} shooters\n`)

    // 6. Copy Tournaments
    console.log('🏅 Step 6: Copying Tournaments...')
    const stagingTournaments = await stagingPrisma.tournament.findMany({
      include: {
        disciplines: true
      }
    })
    
    for (const tournament of stagingTournaments) {
      // First, upsert the tournament without disciplines
      const { disciplines, ...tournamentData } = tournament
      await localPrisma.tournament.upsert({
        where: { id: tournament.id },
        update: tournamentData,
        create: tournamentData
      })

      // Then handle disciplines
      for (const td of disciplines) {
        await localPrisma.tournamentDiscipline.upsert({
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
    console.log(`✅ Copied ${stagingTournaments.length} tournaments\n`)

    // 7. Copy Time Slots
    console.log('⏰ Step 7: Copying Time Slots...')
    const stagingTimeSlots = await stagingPrisma.timeSlot.findMany()
    for (const slot of stagingTimeSlots) {
      await localPrisma.timeSlot.upsert({
        where: { id: slot.id },
        update: slot,
        create: slot
      })
    }
    console.log(`✅ Copied ${stagingTimeSlots.length} time slots\n`)

    // 8. Copy Squads
    console.log('👥 Step 8: Copying Squads...')
    const stagingSquads = await stagingPrisma.squad.findMany()
    for (const squad of stagingSquads) {
      await localPrisma.squad.upsert({
        where: { id: squad.id },
        update: squad,
        create: squad
      })
    }
    console.log(`✅ Copied ${stagingSquads.length} squads\n`)

    // 9. Copy Squad Members
    console.log('🎯 Step 9: Copying Squad Members...')
    const stagingSquadMembers = await stagingPrisma.squadMember.findMany()
    for (const member of stagingSquadMembers) {
      await localPrisma.squadMember.upsert({
        where: { id: member.id },
        update: member,
        create: member
      })
    }
    console.log(`✅ Copied ${stagingSquadMembers.length} squad members\n`)

    // 10. Copy Registrations
    console.log('📝 Step 10: Copying Registrations...')
    const stagingRegistrations = await stagingPrisma.registration.findMany()
    for (const reg of stagingRegistrations) {
      await localPrisma.registration.upsert({
        where: { id: reg.id },
        update: reg,
        create: reg
      })
    }
    console.log(`✅ Copied ${stagingRegistrations.length} registrations\n`)

    // 11. Copy Registration Disciplines
    console.log('📋 Step 11: Copying Registration Disciplines...')
    const stagingRegDisc = await stagingPrisma.registrationDiscipline.findMany()
    for (const rd of stagingRegDisc) {
      await localPrisma.registrationDiscipline.upsert({
        where: { id: rd.id },
        update: rd,
        create: rd
      })
    }
    console.log(`✅ Copied ${stagingRegDisc.length} registration disciplines\n`)

    // 12. Copy Shoots (Scores)
    console.log('🎯 Step 12: Copying Shoots...')
    const stagingShoots = await stagingPrisma.shoot.findMany({
      include: {
        scores: true
      }
    })
    for (const shoot of stagingShoots) {
      const { scores, ...shootData } = shoot
      await localPrisma.shoot.upsert({
        where: { id: shoot.id },
        update: shootData,
        create: shootData
      })

      // Copy scores for this shoot
      for (const score of scores) {
        await localPrisma.score.upsert({
          where: { id: score.id },
          update: score,
          create: score
        })
      }
    }
    console.log(`✅ Copied ${stagingShoots.length} shoots\n`)

    // 13. Copy Shooter Averages
    console.log('📊 Step 13: Copying Shooter Averages...')
    const stagingAverages = await stagingPrisma.shooterAverage.findMany()
    for (const avg of stagingAverages) {
      await localPrisma.shooterAverage.upsert({
        where: { id: avg.id },
        update: avg,
        create: avg
      })
    }
    console.log(`✅ Copied ${stagingAverages.length} shooter averages\n`)

    // 14. Copy Team Join Requests
    console.log('📨 Step 14: Copying Team Join Requests...')
    const stagingRequests = await stagingPrisma.teamJoinRequest.findMany()
    for (const req of stagingRequests) {
      await localPrisma.teamJoinRequest.upsert({
        where: { id: req.id },
        update: req,
        create: req
      })
    }
    console.log(`✅ Copied ${stagingRequests.length} team join requests\n`)

    console.log('🎉 SUCCESS! All data copied from staging to local!\n')
    console.log('📊 Summary:')
    console.log(`   - ${stagingDisciplines.length} disciplines`)
    console.log(`   - ${stagingUsers.length} users`)
    console.log(`   - ${stagingTeams.length} teams`)
    console.log(`   - ${stagingCoaches.length} team coaches`)
    console.log(`   - ${stagingShooters.length} shooters`)
    console.log(`   - ${stagingTournaments.length} tournaments`)
    console.log(`   - ${stagingTimeSlots.length} time slots`)
    console.log(`   - ${stagingSquads.length} squads`)
    console.log(`   - ${stagingSquadMembers.length} squad members`)
    console.log(`   - ${stagingRegistrations.length} registrations`)
    console.log(`   - ${stagingShoots.length} shoots`)
    console.log(`   - ${stagingAverages.length} shooter averages`)
    console.log(`   - ${stagingRequests.length} team join requests`)

  } catch (error) {
    console.error('❌ Error copying data:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await stagingPrisma.$disconnect()
    await localPrisma.$disconnect()
  })

