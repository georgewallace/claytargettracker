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

    // 5. Import Athletes (from shooters in JSON)
    console.log('🎯 Importing Athletes...')
    const shootersData = data.shooters || data.athletes || []
    for (const athlete of shootersData) {
      await prisma.athlete.upsert({
        where: { id: athlete.id },
        update: athlete,
        create: athlete
      })
    }
    console.log(`✅ Imported ${shootersData.length} athletes\n`)

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

    // 10. Import Squad Members (map shooterId to athleteId)
    console.log('🎯 Importing Squad Members...')
    for (const member of data.squadMembers) {
      const { shooterId, ...memberData } = member
      const athleteId = shooterId || member.athleteId // Handle both old and new field names

      await prisma.squadMember.upsert({
        where: { id: member.id },
        update: {
          ...memberData,
          athleteId,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt)
        },
        create: {
          ...memberData,
          athleteId,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt)
        }
      })
    }
    console.log(`✅ Imported ${data.squadMembers.length} squad members\n`)

    // 11. Import Registrations (map shooterId to athleteId if present)
    console.log('📝 Importing Registrations...')
    for (const reg of data.registrations) {
      const { shooterId, ...regData } = reg
      const athleteId = shooterId || reg.athleteId

      await prisma.registration.upsert({
        where: { id: reg.id },
        update: {
          ...regData,
          athleteId,
          createdAt: new Date(reg.createdAt)
        },
        create: {
          ...regData,
          athleteId,
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

    // 12.5. Import Time Slot Preferences
    if (data.timeSlotPreferences && data.timeSlotPreferences.length > 0) {
      console.log('⏰ Importing Time Slot Preferences...')
      for (const pref of data.timeSlotPreferences) {
        await prisma.timeSlotPreference.upsert({
          where: { id: pref.id },
          update: {
            ...pref,
            createdAt: new Date(pref.createdAt)
          },
          create: {
            ...pref,
            createdAt: new Date(pref.createdAt)
          }
        })
      }
      console.log(`✅ Imported ${data.timeSlotPreferences.length} time slot preferences\n`)
    }

    // 12.6. Import Team Tournament Registrations
    if (data.teamTournamentRegistrations && data.teamTournamentRegistrations.length > 0) {
      console.log('🏆 Importing Team Tournament Registrations...')
      for (const teamReg of data.teamTournamentRegistrations) {
        await prisma.teamTournamentRegistration.upsert({
          where: { id: teamReg.id },
          update: {
            ...teamReg,
            createdAt: new Date(teamReg.createdAt),
            updatedAt: new Date(teamReg.updatedAt)
          },
          create: {
            ...teamReg,
            createdAt: new Date(teamReg.createdAt),
            updatedAt: new Date(teamReg.updatedAt)
          }
        })
      }
      console.log(`✅ Imported ${data.teamTournamentRegistrations.length} team tournament registrations\n`)
    }

    // 13. Import Shoots (map shooterId to athleteId and discipline IDs)
    console.log('🎯 Importing Shoots...')
    for (const shoot of data.shoots) {
      const { shooterId, ...shootData } = shoot
      const athleteId = shooterId || shoot.athleteId

      await prisma.shoot.upsert({
        where: { id: shoot.id },
        update: {
          ...shootData,
          athleteId,
          disciplineId: disciplineIdMap[shoot.disciplineId] || shoot.disciplineId,
          date: new Date(shoot.date),
          createdAt: new Date(shoot.createdAt),
          updatedAt: new Date(shoot.updatedAt)
        },
        create: {
          ...shootData,
          athleteId,
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

    // 15. Import Athlete Averages (from shooterAverages in JSON - map shooterId to athleteId and discipline IDs)
    const averagesData = data.shooterAverages || data.athleteAverages || []
    if (averagesData.length > 0) {
      console.log('📊 Importing Athlete Averages...')
      for (const avg of averagesData) {
        const { shooterId, ...avgData } = avg
        const athleteId = shooterId || avg.athleteId

        await prisma.athleteAverage.upsert({
          where: { id: avg.id },
          update: {
            ...avgData,
            athleteId,
            disciplineId: disciplineIdMap[avg.disciplineId] || avg.disciplineId,
            lastUpdated: new Date(avg.lastUpdated),
            createdAt: new Date(avg.createdAt)
          },
          create: {
            ...avgData,
            athleteId,
            disciplineId: disciplineIdMap[avg.disciplineId] || avg.disciplineId,
            lastUpdated: new Date(avg.lastUpdated),
            createdAt: new Date(avg.createdAt)
          }
        })
      }
      console.log(`✅ Imported ${averagesData.length} athlete averages\n`)
    }

    // 16. Import Team Join Requests (map shooterId to athleteId if present)
    if (data.teamJoinRequests && data.teamJoinRequests.length > 0) {
      console.log('📨 Importing Team Join Requests...')
      for (const req of data.teamJoinRequests) {
        const { shooterId, ...reqData } = req
        const athleteId = shooterId || req.athleteId

        await prisma.teamJoinRequest.upsert({
          where: { id: req.id },
          update: {
            ...reqData,
            athleteId,
            createdAt: new Date(req.createdAt),
            updatedAt: new Date(req.updatedAt)
          },
          create: {
            ...reqData,
            athleteId,
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
    console.log(`   - ${shootersData.length} athletes`)
    console.log(`   - ${data.tournaments.length} tournaments`)
    console.log(`   - ${data.tournamentDisciplines.length} tournament disciplines`)
    console.log(`   - ${data.timeSlots.length} time slots`)
    console.log(`   - ${data.squads.length} squads`)
    console.log(`   - ${data.squadMembers.length} squad members`)
    console.log(`   - ${data.registrations.length} registrations`)
    console.log(`   - ${data.registrationDisciplines.length} registration disciplines`)
    console.log(`   - ${data.shoots.length} shoots`)
    console.log(`   - ${data.scores.length} scores`)
    if (averagesData.length > 0) {
      console.log(`   - ${averagesData.length} athlete averages`)
    }
    if (data.teamJoinRequests && data.teamJoinRequests.length > 0) {
      console.log(`   - ${data.teamJoinRequests.length} team join requests`)
    }

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

