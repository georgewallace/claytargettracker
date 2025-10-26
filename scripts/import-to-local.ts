/**
 * Import data from JSON file to local SQLite database
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Importing data to local database...\n')

  try {
    // Read exported data
    const data = JSON.parse(readFileSync('staging-data-export.json', 'utf-8'))

    // 1. Import Disciplines (use name as unique key since it has unique constraint)
    console.log('📋 Importing Disciplines...')
    const disciplineIdMap: Record<string, string> = {}
    for (const disc of data.disciplines) {
      const result = await prisma.discipline.upsert({
        where: { name: disc.name },
        update: {
          displayName: disc.displayName,
          description: disc.description
        },
        create: disc
      })
      disciplineIdMap[disc.id] = result.id // Map old ID to new ID
    }
    console.log(`✅ Imported ${data.disciplines.length} disciplines\n`)

    // 2. Import Users
    console.log('👥 Importing Users...')
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`✅ Imported ${data.users.length} users\n`)

    // 3. Import Teams
    console.log('🏆 Importing Teams...')
    for (const team of data.teams) {
      await prisma.team.upsert({
        where: { id: team.id },
        update: team,
        create: team
      })
    }
    console.log(`✅ Imported ${data.teams.length} teams\n`)

    // 4. Import Team Coaches
    console.log('👨‍🏫 Importing Team Coaches...')
    for (const coach of data.teamCoaches) {
      await prisma.teamCoach.upsert({
        where: { id: coach.id },
        update: coach,
        create: coach
      })
    }
    console.log(`✅ Imported ${data.teamCoaches.length} team coaches\n`)

    // 5. Import Shooters
    console.log('🎯 Importing Shooters...')
    for (const shooter of data.shooters) {
      await prisma.shooter.upsert({
        where: { id: shooter.id },
        update: shooter,
        create: shooter
      })
    }
    console.log(`✅ Imported ${data.shooters.length} shooters\n`)

    // 6. Import Tournaments
    console.log('🏅 Importing Tournaments...')
    for (const tournament of data.tournaments) {
      await prisma.tournament.upsert({
        where: { id: tournament.id },
        update: tournament,
        create: tournament
      })
    }
    console.log(`✅ Imported ${data.tournaments.length} tournaments\n`)

    // 7. Import Tournament Disciplines (map discipline IDs)
    console.log('📋 Importing Tournament Disciplines...')
    for (const td of data.tournamentDisciplines) {
      await prisma.tournamentDiscipline.upsert({
        where: { id: td.id },
        update: {
          ...td,
          disciplineId: disciplineIdMap[td.disciplineId] || td.disciplineId
        },
        create: {
          ...td,
          disciplineId: disciplineIdMap[td.disciplineId] || td.disciplineId
        }
      })
    }
    console.log(`✅ Imported ${data.tournamentDisciplines.length} tournament disciplines\n`)

    // 8. Import Time Slots (map discipline IDs)
    console.log('⏰ Importing Time Slots...')
    for (const slot of data.timeSlots) {
      // Convert date strings back to Date objects and map discipline IDs
      await prisma.timeSlot.upsert({
        where: { id: slot.id },
        update: {
          ...slot,
          disciplineId: disciplineIdMap[slot.disciplineId] || slot.disciplineId,
          date: new Date(slot.date),
          createdAt: new Date(slot.createdAt),
          updatedAt: new Date(slot.updatedAt)
        },
        create: {
          ...slot,
          disciplineId: disciplineIdMap[slot.disciplineId] || slot.disciplineId,
          date: new Date(slot.date),
          createdAt: new Date(slot.createdAt),
          updatedAt: new Date(slot.updatedAt)
        }
      })
    }
    console.log(`✅ Imported ${data.timeSlots.length} time slots\n`)

    // 9. Import Squads
    console.log('👥 Importing Squads...')
    for (const squad of data.squads) {
      await prisma.squad.upsert({
        where: { id: squad.id },
        update: {
          ...squad,
          createdAt: new Date(squad.createdAt),
          updatedAt: new Date(squad.updatedAt)
        },
        create: {
          ...squad,
          createdAt: new Date(squad.createdAt),
          updatedAt: new Date(squad.updatedAt)
        }
      })
    }
    console.log(`✅ Imported ${data.squads.length} squads\n`)

    // 10. Import Squad Members
    console.log('🎯 Importing Squad Members...')
    for (const member of data.squadMembers) {
      await prisma.squadMember.upsert({
        where: { id: member.id },
        update: {
          ...member,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt)
        },
        create: {
          ...member,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt)
        }
      })
    }
    console.log(`✅ Imported ${data.squadMembers.length} squad members\n`)

    // 11. Import Registrations
    console.log('📝 Importing Registrations...')
    for (const reg of data.registrations) {
      await prisma.registration.upsert({
        where: { id: reg.id },
        update: {
          ...reg,
          createdAt: new Date(reg.createdAt)
        },
        create: {
          ...reg,
          createdAt: new Date(reg.createdAt)
        }
      })
    }
    console.log(`✅ Imported ${data.registrations.length} registrations\n`)

    // 12. Import Registration Disciplines (map discipline IDs)
    console.log('📋 Importing Registration Disciplines...')
    for (const rd of data.registrationDisciplines) {
      await prisma.registrationDiscipline.upsert({
        where: { id: rd.id },
        update: {
          ...rd,
          disciplineId: disciplineIdMap[rd.disciplineId] || rd.disciplineId
        },
        create: {
          ...rd,
          disciplineId: disciplineIdMap[rd.disciplineId] || rd.disciplineId
        }
      })
    }
    console.log(`✅ Imported ${data.registrationDisciplines.length} registration disciplines\n`)

    // 13. Import Shoots (map discipline IDs)
    console.log('🎯 Importing Shoots...')
    for (const shoot of data.shoots) {
      await prisma.shoot.upsert({
        where: { id: shoot.id },
        update: {
          ...shoot,
          disciplineId: disciplineIdMap[shoot.disciplineId] || shoot.disciplineId,
          date: new Date(shoot.date),
          createdAt: new Date(shoot.createdAt),
          updatedAt: new Date(shoot.updatedAt)
        },
        create: {
          ...shoot,
          disciplineId: disciplineIdMap[shoot.disciplineId] || shoot.disciplineId,
          date: new Date(shoot.date),
          createdAt: new Date(shoot.createdAt),
          updatedAt: new Date(shoot.updatedAt)
        }
      })
    }
    console.log(`✅ Imported ${data.shoots.length} shoots\n`)

    // 14. Import Scores
    console.log('📊 Importing Scores...')
    for (const score of data.scores) {
      await prisma.score.upsert({
        where: { id: score.id },
        update: {
          ...score,
          createdAt: new Date(score.createdAt),
          updatedAt: new Date(score.updatedAt)
        },
        create: {
          ...score,
          createdAt: new Date(score.createdAt),
          updatedAt: new Date(score.updatedAt)
        }
      })
    }
    console.log(`✅ Imported ${data.scores.length} scores\n`)

    // 15. Import Shooter Averages (map discipline IDs)
    if (data.shooterAverages && data.shooterAverages.length > 0) {
      console.log('📊 Importing Shooter Averages...')
      for (const avg of data.shooterAverages) {
        await prisma.shooterAverage.upsert({
          where: { id: avg.id },
          update: {
            ...avg,
            disciplineId: disciplineIdMap[avg.disciplineId] || avg.disciplineId,
            lastUpdated: new Date(avg.lastUpdated),
            createdAt: new Date(avg.createdAt)
          },
          create: {
            ...avg,
            disciplineId: disciplineIdMap[avg.disciplineId] || avg.disciplineId,
            lastUpdated: new Date(avg.lastUpdated),
            createdAt: new Date(avg.createdAt)
          }
        })
      }
      console.log(`✅ Imported ${data.shooterAverages.length} shooter averages\n`)
    }

    // 16. Import Team Join Requests
    if (data.teamJoinRequests && data.teamJoinRequests.length > 0) {
      console.log('📨 Importing Team Join Requests...')
      for (const req of data.teamJoinRequests) {
        await prisma.teamJoinRequest.upsert({
          where: { id: req.id },
          update: {
            ...req,
            createdAt: new Date(req.createdAt),
            updatedAt: new Date(req.updatedAt)
          },
          create: {
            ...req,
            createdAt: new Date(req.createdAt),
            updatedAt: new Date(req.updatedAt)
          }
        })
      }
      console.log(`✅ Imported ${data.teamJoinRequests.length} team join requests\n`)
    }

    console.log('🎉 SUCCESS! All data imported to local database!\n')
    console.log('📊 Final Summary:')
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

  } catch (error) {
    console.error('❌ Error importing data:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

