# Shoot-Off Implementation Plan

## Overview
Implement a comprehensive shoot-off system for handling tied scores in tournaments, with configurable rules and formats.

## Use Cases

### 1. Tied Final Scores
- After regulation rounds (100/200 targets), shooters with identical scores shoot off for final placements
- Critical for podium positions (1st, 2nd, 3rd)

### 2. Qualification for Finals
- Determine who advances when multiple shooters are tied at cutoff score
- Olympic-style events with qualifying rounds and finals

### 3. Medal/Trophy Placement
- Shoot-offs for championship or registered events
- Especially important for 1st, 2nd, 3rd place ties

### 4. Team Selection/Advancement
- Team trials or league formats
- Determine team membership or advancement

### 5. Perfect Scores
- Multiple shooters hit all targets (e.g., 100/100)
- Shoot-off is only way to determine winner

### 6. Special Awards
- High Gun, HOA (High Over All), HAA (High All-Around)
- Class-specific awards

## Shoot-Off Formats

### Sudden Death
- Shooters fire at targets until one misses and others don't
- Most common format
- Fast and decisive

### Fixed Rounds
- Predetermined number of targets (e.g., 25 targets)
- Highest score wins
- If still tied, can go to sudden death

### Progressive Difficulty
- Starts with standard targets
- Increases difficulty if ties persist
- Doubles, faster presentations, challenging stations

## Database Schema Changes

### Tournament Model - New Fields
```prisma
// Shoot-off Configuration
enableShootOffs          Boolean @default(true)   // Enable shoot-offs for this tournament
shootOffTriggers         String? // JSON: when to trigger shoot-offs (e.g., ["podium", "top5", "perfect"])
shootOffFormat           String  @default("sudden_death") // sudden_death, fixed_rounds, progressive
shootOffTargetsPerRound  Int     @default(2) // Number of targets per round in shoot-off
shootOffStartStation     String? // For discipline-specific shoot-offs (e.g., "station_4")
shootOffRequiresPerfect  Boolean @default(false) // Only shoot off if at least one shooter has perfect score
```

### New Models

#### ShootOff
```prisma
model ShootOff {
  id           String   @id @default(cuid())
  tournamentId String
  disciplineId String?  // Optional - if shoot-off is for specific discipline
  position     Int      // What position is being decided (1=1st place, 2=2nd, etc.)
  status       String   @default("pending") // pending, in_progress, completed
  format       String   // sudden_death, fixed_rounds, progressive
  description  String?  // e.g., "1st Place Shoot-Off - Trap"
  startedAt    DateTime?
  completedAt  DateTime?
  winnerId     String?  // Final winner of shoot-off
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  discipline   Discipline? @relation(fields: [disciplineId], references: [id])
  winner       Shooter? @relation(fields: [winnerId], references: [id])
  participants ShootOffParticipant[]
  rounds       ShootOffRound[]
}
```

#### ShootOffParticipant
```prisma
model ShootOffParticipant {
  id          String   @id @default(cuid())
  shootOffId  String
  shooterId   String
  tiedScore   Int      // Original score that caused the shoot-off
  finalPlace  Int?     // Final placement after shoot-off
  eliminated  Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  shootOff  ShootOff @relation(fields: [shootOffId], references: [id], onDelete: Cascade)
  shooter   Shooter  @relation(fields: [shooterId], references: [id], onDelete: Cascade)
  scores    ShootOffScore[]
}
```

#### ShootOffRound
```prisma
model ShootOffRound {
  id          String   @id @default(cuid())
  shootOffId  String
  roundNumber Int      // 1, 2, 3, etc.
  targets     Int      // Number of targets in this round
  station     String?  // Specific station if applicable
  difficulty  String?  // standard, challenging, extreme
  completedAt DateTime?
  createdAt   DateTime @default(now())
  
  shootOff ShootOff @relation(fields: [shootOffId], references: [id], onDelete: Cascade)
  scores   ShootOffScore[]
}
```

#### ShootOffScore
```prisma
model ShootOffScore {
  id            String   @id @default(cuid())
  roundId       String
  participantId String
  targetsHit    Int      // Number of targets hit in this round
  totalTargets  Int      // Total targets in this round
  createdAt     DateTime @default(now())
  
  round       ShootOffRound        @relation(fields: [roundId], references: [id], onDelete: Cascade)
  participant ShootOffParticipant  @relation(fields: [participantId], references: [id], onDelete: Cascade)
}
```

## UI Components

### 1. Tournament Settings (Creation/Edit)
**Location:** `app/tournaments/[id]/edit/page.tsx`

New section: "Shoot-Off Configuration"
- Enable/disable shoot-offs
- Select triggers (checkboxes):
  - Tied for 1st place
  - Tied for 2nd place
  - Tied for 3rd place
  - Tied for top 5
  - Perfect scores only
  - All ties
- Format selection (dropdown)
- Targets per round (number input)
- Discipline-specific settings (if applicable)

### 2. Shoot-Off Detection & Creation
**Location:** `app/tournaments/[id]/leaderboard/page.tsx`

- Automatic detection of ties based on tournament settings
- "Initiate Shoot-Off" button for admins
- Visual indicators for tied positions
- Badge showing "Shoot-Off Required"

### 3. Shoot-Off Management Interface
**Location:** `app/tournaments/[id]/shoot-offs/page.tsx` (NEW)

Features:
- List of all shoot-offs for tournament
- Status indicators (pending, in-progress, completed)
- Quick actions:
  - Start shoot-off
  - Enter scores
  - Declare winner
  - Cancel/reschedule

### 4. Shoot-Off Score Entry
**Location:** `app/tournaments/[id]/shoot-offs/[shootOffId]/page.tsx` (NEW)

Features:
- Current round display
- Participant list with current standings
- Score entry for each shooter
- Real-time elimination tracking
- "Next Round" or "Declare Winner" buttons
- Historical rounds display

### 5. Leaderboard Updates
**Location:** `app/tournaments/[id]/leaderboard/Leaderboard.tsx`

Updates:
- Show shoot-off indicator next to tied positions
- Display shoot-off results inline
- Link to shoot-off details
- Final placements after shoot-off
- Visual distinction for shoot-off winners

## API Routes

### 1. Create Shoot-Off
**POST** `/api/tournaments/[id]/shoot-offs`
- Auto-detect ties or manual creation
- Validates participants have tied scores
- Creates ShootOff record

### 2. Start Shoot-Off
**PATCH** `/api/tournaments/[id]/shoot-offs/[shootOffId]/start`
- Sets status to "in_progress"
- Records start time
- Creates first round

### 3. Enter Shoot-Off Scores
**POST** `/api/tournaments/[id]/shoot-offs/[shootOffId]/rounds/[roundId]/scores`
- Records scores for a round
- Determines if more rounds needed
- Auto-eliminates shooters
- Declares winner if only one remains

### 4. Complete Shoot-Off
**PATCH** `/api/tournaments/[id]/shoot-offs/[shootOffId]/complete`
- Sets final placements
- Updates tournament results
- Marks shoot-off as completed

### 5. List Shoot-Offs
**GET** `/api/tournaments/[id]/shoot-offs`
- Returns all shoot-offs for tournament
- Filterable by status, discipline

## Implementation Phases

### Phase 1: Database Schema (This PR)
- [x] Update Tournament model with shoot-off settings
- [ ] Create ShootOff model
- [ ] Create ShootOffParticipant model
- [ ] Create ShootOffRound model
- [ ] Create ShootOffScore model
- [ ] Run migrations

### Phase 2: Tournament Settings
- [ ] Add shoot-off configuration to tournament create form
- [ ] Add shoot-off configuration to tournament edit form
- [ ] Update tournament detail page to show settings

### Phase 3: Detection & Creation
- [ ] Implement tie detection logic
- [ ] Add "Initiate Shoot-Off" UI to leaderboard
- [ ] Create API endpoint for shoot-off creation
- [ ] Visual indicators for ties

### Phase 4: Shoot-Off Management
- [ ] Create shoot-offs list page
- [ ] Build shoot-off detail page
- [ ] Implement score entry interface
- [ ] Add round progression logic

### Phase 5: Leaderboard Integration
- [ ] Update leaderboard to show shoot-off status
- [ ] Display final placements after shoot-offs
- [ ] Add shoot-off history view

### Phase 6: Testing & Polish
- [ ] Test all shoot-off formats
- [ ] Test edge cases (3-way ties, 4-way ties, etc.)
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Documentation

## Example Workflows

### Workflow 1: Simple Podium Shoot-Off
1. Tournament completes, two shooters tied for 1st with 95/100
2. Admin sees "Shoot-Off Required" on leaderboard
3. Admin clicks "Initiate Shoot-Off"
4. System creates shoot-off with both participants
5. Admin starts shoot-off, enters station 4
6. Round 1: Both hit 2/2 → Continue
7. Round 2: Shooter A hits 1/2, Shooter B hits 2/2 → Shooter B wins
8. System updates leaderboard: Shooter B = 1st, Shooter A = 2nd

### Workflow 2: Three-Way Tie for 3rd
1. Three shooters tied at 88/100 for 3rd place
2. Admin initiates shoot-off
3. Round 1: Shooters A, B, C score 2/2, 2/2, 1/2
4. Shooter C eliminated (3rd place confirmed)
5. Round 2: Shooters A and B both 2/2
6. Round 3: Shooter A 2/2, Shooter B 1/2
7. Final: Shooter A = 2nd, Shooter B = 3rd, Shooter C = 4th

### Workflow 3: Perfect Score Shoot-Off
1. Two shooters both 100/100
2. Tournament setting: "Require Perfect for Shoot-Off" = true
3. Automatic shoot-off triggered
4. Sudden death format
5. Rounds continue until one misses

## Design Considerations

### Permissions
- Only admins and tournament creators can initiate/manage shoot-offs
- Coaches can view but not edit
- Shooters can view their own shoot-off details

### Notifications (Future)
- Notify participants when shoot-off is scheduled
- Real-time updates during shoot-off
- Completion notifications

### Historical Data
- Preserve all shoot-off rounds and scores
- Allow review of past shoot-offs
- Statistics on shoot-off performance

### Mobile Support
- Responsive design for all interfaces
- Touch-friendly score entry
- Quick access to shoot-off status

## Success Criteria
- [ ] Admins can configure shoot-off settings per tournament
- [ ] System automatically detects ties requiring shoot-offs
- [ ] Admins can initiate and manage shoot-offs
- [ ] Score entry is intuitive and error-free
- [ ] Leaderboards accurately reflect shoot-off results
- [ ] All shoot-off data is preserved for historical review
- [ ] Mobile-friendly interface
- [ ] Comprehensive error handling

