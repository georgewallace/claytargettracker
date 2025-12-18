# Excel Export/Import Mapping & Analysis

## Workflow Overview
1. **App**: Registration & Squad Assignment
2. **Excel**: Offline Score Entry (TournamentTracker.xlsx)
3. **App**: Import Scores
4. **App**: Display Leaderboard

---

## Current App Export vs TournamentTracker.xlsx

### What Our App Currently Exports (3 sheets)

#### Sheet 1: Teams
- Team Name
- Affiliation
- Total Athletes
- Registered Athletes
- Team Type (Individual vs Team)

#### Sheet 2: Participants
- Athlete Name
- Email
- Team
- Gender
- Birth Date
- Grade
- Division (Age Concurrent)
- NSCA Class
- ATA Class
- Disciplines
- Registration Date
- Status

#### Sheet 3: Squad Assignments
- Squad Name
- Discipline
- Date
- Start Time
- End Time
- Field/Station
- Athlete Name
- Team
- Division
- Position

---

### What TournamentTracker.xlsx Contains (11 sheets)

#### Tournament Setup Sheet
- Events enabled (Skeet, Trap, Sporting Clays)
- Fees per event
- **Not in our app**: Event-level fees

#### Team Setup Sheet
- Team ID
- Team Name
- Head Coach
- Email
- Address, City, State, ZIP
- Phone
- Team Affiliation
- **Match**: ✅ Team name, affiliation
- **Missing in app**: Team ID format, full contact info, address

#### Individual Setup Sheet
- Shooter ID (e.g., "26-1000")
- First Name, Last Name
- Birthdate (Excel serial number)
- Sex
- Contact Phone, Email
- Shooting Team
- Age Concurrent (division)
- Disciplines (Y/N columns: Skeet, Trap, Sporting Clays)
- Classes per discipline (Skeet Class, Trap Class, Sporting Class)
- **Match**: ✅ Name, birthdate, gender, email, team, disciplines
- **Missing in app**: Shooter ID format, discipline-specific classes

#### Shooter-Squad Assignment Sheet
- Shooter ID, Team, Name
- Concurrent (division)
- Per discipline:
  - Event name
  - Squad Position
  - Shooting Time
  - Squad Key (e.g., "Brighton Clay Crushers-Novice 1-Skeet")
  - Squad # (numeric ID)
  - Shooter Key (e.g., "235-1")
- **Match**: ✅ Squad assignments, positions, times
- **Missing in app**: Squad Key format, numeric Squad IDs

#### Squad Listing Sheet
- Squad # (numeric ID)
- Squad Key (Team-Concurrent-Discipline)
- Team Name
- Concurrent (division)
- Discipline
- Participant #1-5 (ID and Name)
- **Match**: ✅ Squad roster concept
- **Different**: We use flexible position numbers, they use fixed 1-5 slots

#### Tournament List Sheet (MAIN SCORING SHEET)
This is the critical sheet for score import! Contains:
- Shooter ID, Name, Birthdate, Sex
- Events registered (Y/N flags)
- Total Amount, Paid (fees)
- Shooting Team
- Age Concurrent

**Per Discipline (Skeet, Trap, Sporting):**
- Squad # and Position
- Captain flag
- Squad name
- Team Score
- Individual Score
- Team Tie Breaker
- Shooting Class
- Shooting Average
- Individual Rank
- Total Score
- Individual Tie Breaker
- Round scores (Round 1-4 for Skeet/Trap, Station 1-20 for Sporting)
- HAA Place, Concurrent Place, Class Place, Team Place

**Missing in app database:**
- Individual round/station scores
- Tie breaker scores
- Calculated averages
- Place/rank fields
- Captain designation
- Fee tracking

#### Skeet Ind Concurrent Ranking Sheet
- Rankings by age concurrent (HOA, Novice, Int, JV, Varsity, Collegiate)
- Rankings by class (A, B, C, D)
- Rankings by gender within each category
- Team scores and order
- **Missing in app**: Complex ranking calculations

#### Skeet Team Scores Sheet
- Team rankings by concurrent level
- Team member scores
- **Missing in app**: Team scoring logic

#### Other Score Sheets
- Concurrent-specific scores
- Class-specific scores
- **Missing in app**: These detailed breakdowns

---

## Data Model Gaps for Full Workflow

### Missing Database Fields

#### Tournament Table
- ✅ Has: enableScores, enableLeaderboard
- ❌ Missing: Fee structure per discipline

#### Athlete Table
- ✅ Has: nscaClass, ataClass
- ❌ Missing: Discipline-specific classes (skeetClass, trapClass, sportingClass)
- ❌ Missing: Shooter ID format (e.g., "26-1000")

#### Squad Table
- ✅ Has: name, discipline, timeSlot
- ❌ Missing: Numeric squad ID
- ❌ Missing: Squad key format (Team-Concurrent-Discipline)

#### SquadAssignment Table (SquadMember)
- ✅ Has: position
- ❌ Missing: Captain flag
- ❌ Missing: Shooter key format

#### NEW TABLES NEEDED

**Score Table**
```prisma
model Score {
  id              String   @id @default(cuid())
  shootId         String
  shoot           Shoot    @relation(fields: [shootId], references: [id])
  roundNumber     Int?     // For Skeet/Trap (1-4)
  stationNumber   Int?     // For Sporting Clays (1-20)
  score           Int
  createdAt       DateTime @default(now())

  @@index([shootId])
}
```

**Ranking Table** (calculated/cached)
```prisma
model Ranking {
  id                String   @id @default(cuid())
  tournamentId      String
  tournament        Tournament @relation(fields: [tournamentId], references: [id])
  athleteId         String
  athlete           Athlete  @relation(fields: [athleteId], references: [id])
  disciplineId      String
  discipline        Discipline @relation(fields: [disciplineId], references: [id])

  totalScore        Int
  tieBreaker        Int?
  shootingAverage   Float?

  // Rankings
  overallRank       Int?
  concurrentRank    Int?
  classRank         Int?
  teamRank          Int?
  genderRank        Int?

  // Places
  hoaPlace          Int?
  concurrentPlace   Int?
  classPlace        Int?
  teamPlace         Int?

  calculatedAt      DateTime @default(now())

  @@unique([tournamentId, athleteId, disciplineId])
}
```

---

## Export Enhancement Needed

Our current export creates basic registration data. For the full workflow, we need:

### Enhanced Export Structure

**Sheet 1: Tournament Setup** (NEW)
- Event names and configurations
- Fees
- Date, location

**Sheet 2: Team Setup** (ENHANCED)
- Add: Team ID format
- Add: Coach contact info
- Keep: Team name, affiliation

**Sheet 3: Individual Setup** (ENHANCED - replaces Participants)
- Add: Shooter ID column (generate format: YY-XXXX)
- Add: Discipline columns (Y/N for Skeet, Trap, Sporting)
- Add: Class columns per discipline
- Keep: Name, birthdate, gender, team, email

**Sheet 4: Shooter-Squad Assignment** (ENHANCED - replaces Squad Assignments)
- Add: Shooter ID
- Add: Per-discipline squad info (Squad #, Squad Key, Position)
- Add: Shooting time per discipline
- Format: One row per shooter with all their squad assignments

**Sheet 5: Tournament List** (NEW - for score entry)
- Pre-populated with all registered shooters
- Empty score columns (Round 1-4 or Station 1-20)
- Ready for manual score entry
- This is the sheet that gets edited and re-imported

**Sheet 6: Squad Listing** (ENHANCED)
- Squad # (numeric)
- Squad Key (Team-Concurrent-Discipline)
- Fixed positions 1-5 with shooter IDs

---

## Import Requirements

When importing the Excel file back after scores are entered:

1. **Read Tournament List sheet**
2. **For each shooter row:**
   - Match by Shooter ID
   - Read round/station scores
   - Calculate total score
   - Store in Score table linked to Shoot
3. **Calculate rankings:**
   - Overall (HOA)
   - By concurrent (division)
   - By class
   - By team
   - By gender
4. **Update leaderboard cache**

---

## Implementation Priority

### Phase 1: Enhanced Export (Next)
- [ ] Modify export to match TournamentTracker.xlsx structure
- [ ] Add Shooter ID generation
- [ ] Add Tournament Setup sheet
- [ ] Enhance Individual Setup sheet
- [ ] Enhance Squad Assignment sheet to per-shooter format
- [ ] Add Tournament List sheet for score entry

### Phase 2: Score Tracking
- [ ] Add Score model to schema
- [ ] Add individual round/station score tracking
- [ ] Modify scoring UI to support round-by-round entry

### Phase 3: Import Functionality
- [ ] Create import API endpoint
- [ ] Parse Tournament List sheet
- [ ] Extract scores by round/station
- [ ] Validate and store scores

### Phase 4: Rankings & Leaderboard
- [ ] Add Ranking model
- [ ] Implement ranking calculation algorithms
- [ ] Update leaderboard to show rankings
- [ ] Show concurrent/class/team/gender breakdowns

---

## Key Differences to Address

1. **Shooter ID Format**: App uses cuid(), Excel uses YY-XXXX format
   - Solution: Generate and store formatted ID for export/import

2. **Squad Numbering**: App uses cuid(), Excel uses numeric IDs
   - Solution: Generate sequential squad numbers for export

3. **Score Granularity**: App stores total scores, Excel tracks per-round
   - Solution: Add Score table for round/station-level tracking

4. **Classes per Discipline**: App has nscaClass/ataClass globally
   - Solution: Store discipline-specific classes or map during export

5. **Captain Designation**: Not tracked in app
   - Solution: Add captain flag to SquadMember table

6. **Fee Tracking**: Not in app
   - Solution: Add fee fields to tournament discipline config
