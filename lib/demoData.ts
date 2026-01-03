// Mock data for demo mode
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Demo Users
export const demoUsers = [
  {
    id: 'demo-admin-1',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    role: 'admin',
    password: 'hashed_password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'demo-coach-1',
    email: 'coach@demo.com',
    name: 'Coach Smith',
    role: 'coach',
    password: 'hashed_password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'demo-shooter-1',
    email: 'shooter@demo.com',
    name: 'Alex Johnson',
    role: 'shooter',
    password: 'hashed_password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// Demo Team
export const demoTeam = {
  id: 'demo-team-1',
  name: 'Demo High School',
  coachId: 'demo-coach-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

// Demo Disciplines
export const demoDisciplines = [
  { id: 'disc-1', name: 'sporting_clays', displayName: 'Sporting Clays', description: null },
  { id: 'disc-2', name: 'skeet', displayName: 'Skeet', description: null },
  { id: 'disc-3', name: 'trap', displayName: 'Trap', description: null },
  { id: 'disc-4', name: 'five_stand', displayName: '5-Stand', description: null }
]

// Demo Shooters (48 shooters across all divisions)
export const demoShooters = [
  // Novice
  { id: 'shooter-1', userId: 'user-1', teamId: 'demo-team-1', birthMonth: 3, birthYear: 2012, grade: '6', division: 'Novice', user: { id: 'user-1', name: 'Emma Rodriguez', email: 'emma@demo.com' }, team: demoTeam },
  { id: 'shooter-2', userId: 'user-2', teamId: 'demo-team-1', birthMonth: 5, birthYear: 2013, grade: '5', division: 'Novice', user: { id: 'user-2', name: 'Liam Chen', email: 'liam@demo.com' }, team: demoTeam },
  { id: 'shooter-3', userId: 'user-3', teamId: null, birthMonth: 7, birthYear: 2012, grade: '6', division: 'Novice', user: { id: 'user-3', name: 'Sophia Martinez', email: 'sophia@demo.com' }, team: null },
  { id: 'shooter-4', userId: 'user-4', teamId: null, birthMonth: 9, birthYear: 2014, grade: '4', division: 'Novice', user: { id: 'user-4', name: 'Noah Williams', email: 'noah@demo.com' }, team: null },
  
  // Intermediate
  { id: 'shooter-5', userId: 'user-5', teamId: 'demo-team-1', birthMonth: 2, birthYear: 2011, grade: '7', division: 'Intermediate', user: { id: 'user-5', name: 'Olivia Brown', email: 'olivia@demo.com' }, team: demoTeam },
  { id: 'shooter-6', userId: 'user-6', teamId: 'demo-team-1', birthMonth: 4, birthYear: 2010, grade: '8', division: 'Intermediate', user: { id: 'user-6', name: 'Ethan Davis', email: 'ethan@demo.com' }, team: demoTeam },
  { id: 'shooter-7', userId: 'user-7', teamId: null, birthMonth: 6, birthYear: 2011, grade: '7', division: 'Intermediate', user: { id: 'user-7', name: 'Ava Taylor', email: 'ava@demo.com' }, team: null },
  { id: 'shooter-8', userId: 'user-8', teamId: 'demo-team-1', birthMonth: 8, birthYear: 2010, grade: '8', division: 'Intermediate', user: { id: 'user-8', name: 'Mason Anderson', email: 'mason@demo.com' }, team: demoTeam },
  { id: 'shooter-9', userId: 'user-9', teamId: null, birthMonth: 10, birthYear: 2011, grade: '7', division: 'Intermediate', user: { id: 'user-9', name: 'Isabella Thomas', email: 'isabella@demo.com' }, team: null },
  
  // Junior Varsity
  { id: 'shooter-10', userId: 'user-10', teamId: 'demo-team-1', birthMonth: 1, birthYear: 2009, grade: '9', division: 'Junior Varsity', user: { id: 'user-10', name: 'James Jackson', email: 'james@demo.com' }, team: demoTeam },
  { id: 'shooter-11', userId: 'user-11', teamId: 'demo-team-1', birthMonth: 3, birthYear: 2009, grade: '9', division: 'Junior Varsity', user: { id: 'user-11', name: 'Charlotte White', email: 'charlotte@demo.com' }, team: demoTeam },
  { id: 'shooter-12', userId: 'user-12', teamId: null, birthMonth: 5, birthYear: 2009, grade: '9', division: 'Junior Varsity', user: { id: 'user-12', name: 'Benjamin Harris', email: 'benjamin@demo.com' }, team: null },
  { id: 'shooter-13', userId: 'user-13', teamId: 'demo-team-1', birthMonth: 7, birthYear: 2009, grade: '9', division: 'Junior Varsity', user: { id: 'user-13', name: 'Amelia Martin', email: 'amelia@demo.com' }, team: demoTeam },
  
  // Senior
  { id: 'shooter-14', userId: 'user-14', teamId: 'demo-team-1', birthMonth: 2, birthYear: 2008, grade: '10', division: 'Senior', user: { id: 'user-14', name: 'Lucas Thompson', email: 'lucas@demo.com' }, team: demoTeam },
  { id: 'shooter-15', userId: 'user-15', teamId: 'demo-team-1', birthMonth: 4, birthYear: 2007, grade: '11', division: 'Senior', user: { id: 'user-15', name: 'Mia Garcia', email: 'mia@demo.com' }, team: demoTeam },
  { id: 'shooter-16', userId: 'user-16', teamId: null, birthMonth: 6, birthYear: 2006, grade: '12', division: 'Senior', user: { id: 'user-16', name: 'Henry Martinez', email: 'henry@demo.com' }, team: null },
  { id: 'shooter-17', userId: 'user-17', teamId: 'demo-team-1', birthMonth: 8, birthYear: 2008, grade: '10', division: 'Senior', user: { id: 'user-17', name: 'Harper Robinson', email: 'harper@demo.com' }, team: demoTeam },
  { id: 'shooter-18', userId: 'user-18', teamId: null, birthMonth: 10, birthYear: 2007, grade: '11', division: 'Senior', user: { id: 'user-18', name: 'Alexander Clark', email: 'alexander@demo.com' }, team: null },
  { id: 'shooter-19', userId: 'user-19', teamId: 'demo-team-1', birthMonth: 12, birthYear: 2006, grade: '12', division: 'Senior', user: { id: 'user-19', name: 'Evelyn Rodriguez', email: 'evelyn@demo.com' }, team: demoTeam },
  
  // College
  { id: 'shooter-20', userId: 'user-20', teamId: null, birthMonth: 3, birthYear: 2003, grade: 'College', division: 'College-Trade School', user: { id: 'user-20', name: 'Michael Lewis', email: 'michael@demo.com' }, team: null },
  { id: 'shooter-21', userId: 'user-21', teamId: null, birthMonth: 6, birthYear: 2004, grade: 'College', division: 'College-Trade School', user: { id: 'user-21', name: 'Emily Walker', email: 'emily@demo.com' }, team: null },
  { id: 'shooter-22', userId: 'user-22', teamId: null, birthMonth: 9, birthYear: 2003, grade: 'College', division: 'College-Trade School', user: { id: 'user-22', name: 'Daniel Hall', email: 'daniel@demo.com' }, team: null }
]

// Demo Tournament
export const demoTournament = {
  id: 'demo-tournament-1',
  name: 'Spring Championship 2025',
  description: 'Annual spring clay shooting championship featuring multiple disciplines',
  location: 'Demo Shooting Range',
  startDate: new Date('2025-03-15'),
  endDate: new Date('2025-03-16'),
  status: 'active',
  createdById: 'demo-admin-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-03-15T10:30:00'),
  createdBy: demoUsers[0],
  disciplines: [
    { id: 'td-1', tournamentId: 'demo-tournament-1', disciplineId: 'disc-1', discipline: demoDisciplines[0] },
    { id: 'td-2', tournamentId: 'demo-tournament-1', disciplineId: 'disc-2', discipline: demoDisciplines[1] },
    { id: 'td-3', tournamentId: 'demo-tournament-1', disciplineId: 'disc-3', discipline: demoDisciplines[2] }
  ],
  registrations: demoShooters.map((shooter, idx) => ({
    id: `reg-${idx + 1}`,
    tournamentId: 'demo-tournament-1',
    shooterId: shooter.id,
    status: 'registered',
    createdAt: new Date('2025-02-01'),
    shooter: shooter,
    disciplines: [
      { id: `rd-${idx * 3 + 1}`, registrationId: `reg-${idx + 1}`, disciplineId: 'disc-1', discipline: demoDisciplines[0] },
      { id: `rd-${idx * 3 + 2}`, registrationId: `reg-${idx + 1}`, disciplineId: 'disc-2', discipline: demoDisciplines[1] },
      { id: `rd-${idx * 3 + 3}`, registrationId: `reg-${idx + 1}`, disciplineId: 'disc-3', discipline: demoDisciplines[2] }
    ]
  })),
  shoots: [] as any[], // Will be generated with scores
  timeSlots: [] as any[]
}

// Generate demo scores (realistic scores for each discipline)
const generateDemoScores = () => {
  const shoots: any[] = []
  const twoMinutesAgo = new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago for recent updates
  const olderTime = new Date('2025-03-15T09:00:00')
  
  demoShooters.forEach((shooter, shooterIdx) => {
    // Sporting Clays (single round, max ~25)
    const scScore = Math.floor(Math.random() * 8) + 18 // 18-25
    const scShoot = {
      id: `shoot-sc-${shooterIdx}`,
      tournamentId: 'demo-tournament-1',
      shooterId: shooter.id,
      disciplineId: 'disc-1',
      date: new Date('2025-03-15'),
      notes: null,
      createdAt: olderTime,
      updatedAt: shooterIdx < 3 ? twoMinutesAgo : olderTime, // First 3 shooters are recent
      shooter: shooter,
      discipline: demoDisciplines[0],
      scores: [
        { id: `score-sc-${shooterIdx}`, shootId: `shoot-sc-${shooterIdx}`, station: 1, targets: scScore, totalTargets: 25, createdAt: olderTime, updatedAt: shooterIdx < 3 ? twoMinutesAgo : olderTime }
      ]
    }
    shoots.push(scShoot)
    
    // Skeet (4 rounds, max 25 each)
    const skeetScores = [
      Math.floor(Math.random() * 8) + 18,
      Math.floor(Math.random() * 8) + 18,
      Math.floor(Math.random() * 8) + 18,
      Math.floor(Math.random() * 8) + 18
    ]
    const skeetShoot = {
      id: `shoot-skeet-${shooterIdx}`,
      tournamentId: 'demo-tournament-1',
      shooterId: shooter.id,
      disciplineId: 'disc-2',
      date: new Date('2025-03-15'),
      notes: null,
      createdAt: olderTime,
      updatedAt: shooterIdx >= 3 && shooterIdx < 6 ? twoMinutesAgo : olderTime, // Next 3 shooters are recent
      shooter: shooter,
      discipline: demoDisciplines[1],
      scores: skeetScores.map((targets, idx) => ({
        id: `score-skeet-${shooterIdx}-${idx}`,
        shootId: `shoot-skeet-${shooterIdx}`,
        station: idx + 1,
        targets: targets,
        totalTargets: 25,
        createdAt: olderTime,
        updatedAt: shooterIdx >= 3 && shooterIdx < 6 ? twoMinutesAgo : olderTime
      }))
    }
    shoots.push(skeetShoot)
    
    // Trap (4 rounds, max 25 each)
    const trapScores = [
      Math.floor(Math.random() * 8) + 18,
      Math.floor(Math.random() * 8) + 18,
      Math.floor(Math.random() * 8) + 18,
      Math.floor(Math.random() * 8) + 18
    ]
    const trapShoot = {
      id: `shoot-trap-${shooterIdx}`,
      tournamentId: 'demo-tournament-1',
      shooterId: shooter.id,
      disciplineId: 'disc-3',
      date: new Date('2025-03-15'),
      notes: null,
      createdAt: olderTime,
      updatedAt: olderTime,
      shooter: shooter,
      discipline: demoDisciplines[2],
      scores: trapScores.map((targets, idx) => ({
        id: `score-trap-${shooterIdx}-${idx}`,
        shootId: `shoot-trap-${shooterIdx}`,
        station: idx + 1,
        targets: targets,
        totalTargets: 25,
        createdAt: olderTime,
        updatedAt: olderTime
      }))
    }
    shoots.push(trapShoot)
  })
  
  return shoots
}

// Generate demo time slots and squads
const generateDemoTimeSlots = () => {
  const timeSlots: any[] = []
  
  // Sporting Clays - Day 1
  const scSlot = {
    id: 'ts-sc-1',
    tournamentId: 'demo-tournament-1',
    disciplineId: 'disc-1',
    date: new Date('2025-03-15'),
    startTime: '09:00',
    endTime: '12:00',
    stationNumber: 'Station 1',
    fieldNumber: null,
    capacity: 30,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    discipline: demoDisciplines[0],
    squads: [
      {
        id: 'squad-sc-1',
        timeSlotId: 'ts-sc-1',
        name: 'SC Squad A',
        capacity: 5,
        teamOnly: false,
        notes: null,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
        members: demoShooters.slice(0, 5).map((shooter, idx) => ({
          id: `sm-sc-${idx}`,
          squadId: 'squad-sc-1',
          shooterId: shooter.id,
          position: idx + 1,
          createdAt: new Date('2025-02-01'),
          updatedAt: new Date('2025-02-01'),
          shooter: shooter
        }))
      }
    ]
  }
  timeSlots.push(scSlot)
  
  // Skeet - Day 1
  const skeetSlot = {
    id: 'ts-skeet-1',
    tournamentId: 'demo-tournament-1',
    disciplineId: 'disc-2',
    date: new Date('2025-03-15'),
    startTime: '10:00',
    endTime: '13:00',
    stationNumber: null,
    fieldNumber: 'Field 2',
    capacity: 25,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    discipline: demoDisciplines[1],
    squads: [
      {
        id: 'squad-skeet-1',
        timeSlotId: 'ts-skeet-1',
        name: 'Skeet Squad A',
        capacity: 5,
        teamOnly: false,
        notes: null,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
        members: demoShooters.slice(5, 10).map((shooter, idx) => ({
          id: `sm-skeet-${idx}`,
          squadId: 'squad-skeet-1',
          shooterId: shooter.id,
          position: idx + 1,
          createdAt: new Date('2025-02-01'),
          updatedAt: new Date('2025-02-01'),
          shooter: shooter
        }))
      }
    ]
  }
  timeSlots.push(skeetSlot)
  
  // Trap - Day 2
  const trapSlot = {
    id: 'ts-trap-1',
    tournamentId: 'demo-tournament-1',
    disciplineId: 'disc-3',
    date: new Date('2025-03-16'),
    startTime: '09:00',
    endTime: '12:00',
    stationNumber: null,
    fieldNumber: 'Field 3',
    capacity: 25,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    discipline: demoDisciplines[2],
    squads: [
      {
        id: 'squad-trap-1',
        timeSlotId: 'ts-trap-1',
        name: 'Trap Squad A',
        capacity: 5,
        teamOnly: true,
        notes: 'Team only squad',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
        members: demoShooters.slice(10, 15).map((shooter, idx) => ({
          id: `sm-trap-${idx}`,
          squadId: 'squad-trap-1',
          shooterId: shooter.id,
          position: idx + 1,
          createdAt: new Date('2025-02-01'),
          updatedAt: new Date('2025-02-01'),
          shooter: shooter
        }))
      }
    ]
  }
  timeSlots.push(trapSlot)
  
  return timeSlots
}

// Add generated data to tournament
demoTournament.shoots = generateDemoScores()
demoTournament.timeSlots = generateDemoTimeSlots()

// All demo tournaments
export const demoTournaments = [
  demoTournament,
  {
    id: 'demo-tournament-2',
    name: 'Fall Invitational 2024',
    description: 'Annual fall tournament',
    location: 'Central Range',
    startDate: new Date('2024-10-15'),
    endDate: new Date('2024-10-16'),
    status: 'completed',
    createdById: 'demo-admin-1',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-10-16'),
    createdBy: demoUsers[0],
    disciplines: [
      { id: 'td-4', tournamentId: 'demo-tournament-2', disciplineId: 'disc-2', discipline: demoDisciplines[1] },
      { id: 'td-5', tournamentId: 'demo-tournament-2', disciplineId: 'disc-3', discipline: demoDisciplines[2] }
    ],
    registrations: [],
    shoots: [],
    timeSlots: []
  },
  {
    id: 'demo-tournament-3',
    name: 'Summer Classic 2025',
    description: 'Upcoming summer event',
    location: 'Lakeside Range',
    startDate: new Date('2025-07-20'),
    endDate: new Date('2025-07-21'),
    status: 'upcoming',
    createdById: 'demo-admin-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    createdBy: demoUsers[0],
    disciplines: [
      { id: 'td-6', tournamentId: 'demo-tournament-3', disciplineId: 'disc-1', discipline: demoDisciplines[0] },
      { id: 'td-7', tournamentId: 'demo-tournament-3', disciplineId: 'disc-4', discipline: demoDisciplines[3] }
    ],
    registrations: [],
    shoots: [],
    timeSlots: []
  }
]

// Export helper to get demo user session
export const getDemoUserSession = (role: 'admin' | 'coach' | 'shooter' = 'admin') => {
  const user = demoUsers.find(u => u.role === role) || demoUsers[0]
  
  return {
    ...user,
    shooter: role === 'shooter' ? demoShooters[0] : role === 'coach' ? null : null,
    coachedTeam: role === 'coach' ? demoTeam : null
  }
}

// Check if we're in demo mode
export const isDemoMode = () => DEMO_MODE

// Demo mode notice message
export const DEMO_NOTICE = `
🎭 DEMO MODE - This is a demonstration of the COYESS Tournaments application.
All data is simulated and changes will not be saved.
`

