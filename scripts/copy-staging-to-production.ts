/**
 * Copy ALL data from staging database to production
 * Run this after deploying code to production
 */

import { PrismaClient } from '@prisma/client'

if (!process.env.STAGING_DATABASE_URL) {
  console.error('❌ Error: STAGING_DATABASE_URL environment variable is required')
  process.exit(1)
}

if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('❌ Error: PRODUCTION_DATABASE_URL environment variable is required')
  process.exit(1)
}

// Staging database
const stagingPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.STAGING_DATABASE_URL
    }
  }
})

// Production database
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRODUCTION_DATABASE_URL
    }
  }
})

async function main() {
  console.log('🚀 Copying ALL data from staging to production...\n')
  console.log('⚠️  WARNING: This will overwrite production data!\n')

  try {
    // 1. Copy Disciplines
    console.log('📋 Step 1: Copying Disciplines...')
    const disciplines = await stagingPrisma.discipline.findMany()
    for (const disc of disciplines) {
      await productionPrisma.discipline.upsert({
        where: { id: disc.id },
        update: disc,
        create: disc
      })
    }
    console.log(`✅ Copied ${disciplines.length} disciplines\n`)

    // 2. Copy Users
    console.log('👥 Step 2: Copying Users...')
    const users = await stagingPrisma.user.findMany()
    for (const user of users) {
      await productionPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`✅ Copied ${users.length} users\n`)

    // 3. Copy Teams
    console.log('🏆 Step 3: Copying Teams...')
    const teams = await stagingPrisma.team.findMany()
    for (const team of teams) {
      await productionPrisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team
      })
    }
    console.log(`✅ Copied ${teams.length} teams\n`)

    // 4. Copy Shooters
    console.log('🎯 Step 4: Copying Shooters...')
    const shooters = await stagingPrisma.shooter.findMany()
    for (const shooter of shooters) {
      await productionPrisma.shooter.upsert({
        where: { id: shooter.id },
        update: shooter,
        create: shooter
      })
    }
    console.log(`✅ Copied ${shooters.length} shooters\n`)

    // 5. Copy Tournaments
    console.log('🏅 Step 5: Copying Tournaments...')
    const tournaments = await stagingPrisma.tournament.findMany({
      include: {
        disciplines: true
      }
    })
    
    for (const tournament of tournaments) {
      const { disciplines, ...tournamentData } = tournament
      await productionPrisma.tournament.upsert({
        where: { id: tournament.id },
        update: tournamentData,
        create: tournamentData
      })

      for (const td of disciplines) {
        await productionPrisma.tournamentDiscipline.upsert({
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
    console.log(`✅ Copied ${tournaments.length} tournaments\n`)

    // 6. Copy Time Slots
    console.log('⏰ Step 6: Copying Time Slots...')
    const timeSlots = await stagingPrisma.timeSlot.findMany()
    for (const slot of timeSlots) {
      await productionPrisma.timeSlot.upsert({
        where: { id: slot.id },
        update: slot,
        create: slot
      })
    }
    console.log(`✅ Copied ${timeSlots.length} time slots\n`)

    // 7. Copy Squads
    console.log('👥 Step 7: Copying Squads...')
    const squads = await stagingPrisma.squad.findMany()
    for (const squad of squads) {
      await productionPrisma.squad.upsert({
        where: { id: squad.id },
        update: squad,
        create: squad
      })
    }
    console.log(`✅ Copied ${squads.length} squads\n`)

    // 8. Copy Squad Members
    console.log('🎯 Step 8: Copying Squad Members...')
    const squadMembers = await stagingPrisma.squadMember.findMany()
    for (const member of squadMembers) {
      await productionPrisma.squadMember.upsert({
        where: { id: member.id },
        update: member,
        create: member
      })
    }
    console.log(`✅ Copied ${squadMembers.length} squad members\n`)

    // 9. Copy Registrations
    console.log('📝 Step 9: Copying Registrations...')
    const registrations = await stagingPrisma.registration.findMany()
    for (const reg of registrations) {
      await productionPrisma.registration.upsert({
        where: { id: reg.id },
        update: reg,
        create: reg
      })
    }
    console.log(`✅ Copied ${registrations.length} registrations\n`)

    // 10. Copy Registration Disciplines
    console.log('📋 Step 10: Copying Registration Disciplines...')
    const regDisc = await stagingPrisma.registrationDiscipline.findMany()
    for (const rd of regDisc) {
      await productionPrisma.registrationDiscipline.upsert({
        where: { id: rd.id },
        update: rd,
        create: rd
      })
    }
    console.log(`✅ Copied ${regDisc.length} registration disciplines\n`)

    // 11. Copy Shoots
    console.log('🎯 Step 11: Copying Shoots...')
    const shoots = await stagingPrisma.shoot.findMany()
    for (const shoot of shoots) {
      await productionPrisma.shoot.upsert({
        where: { id: shoot.id },
        update: shoot,
        create: shoot
      })
    }
    console.log(`✅ Copied ${shoots.length} shoots\n`)

    // 12. Copy Scores
    console.log('📊 Step 12: Copying Scores...')
    const scores = await stagingPrisma.score.findMany()
    let copied = 0
    for (const score of scores) {
      await productionPrisma.score.upsert({
        where: { id: score.id },
        update: score,
        create: score
      })
      copied++
      if (copied % 500 === 0) {
        console.log(`  Copied ${copied}/${scores.length}...`)
      }
    }
    console.log(`✅ Copied ${scores.length} scores\n`)

    // 13. Copy Team Join Requests
    console.log('📨 Step 13: Copying Team Join Requests...')
    const requests = await stagingPrisma.teamJoinRequest.findMany()
    for (const req of requests) {
      await productionPrisma.teamJoinRequest.upsert({
        where: { id: req.id },
        update: req,
        create: req
      })
    }
    console.log(`✅ Copied ${requests.length} team join requests\n`)

    console.log('🎉 SUCCESS! All data copied to production!\n')
    console.log('📊 Summary:')
    console.log(`   - ${disciplines.length} disciplines`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${teams.length} teams`)
    console.log(`   - ${shooters.length} shooters`)
    console.log(`   - ${tournaments.length} tournaments`)
    console.log(`   - ${timeSlots.length} time slots`)
    console.log(`   - ${squads.length} squads`)
    console.log(`   - ${squadMembers.length} squad members`)
    console.log(`   - ${registrations.length} registrations`)
    console.log(`   - ${shoots.length} shoots`)
    console.log(`   - ${scores.length} scores`)
    console.log(`   - ${requests.length} team join requests`)

  } catch (error) {
    console.error('❌ Error copying data:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await stagingPrisma.$disconnect()
    await productionPrisma.$disconnect()
  })

