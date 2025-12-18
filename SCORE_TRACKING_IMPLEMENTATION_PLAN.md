# Score Tracking & Excel Import/Export Implementation Plan

## Overview
Complete the tournament workflow: Registration (App) → Score Entry (Excel) → Import (App) → Leaderboard Display (App)

## Reference Documents
- `EXCEL_EXPORT_IMPORT_MAPPING.md` - Detailed mapping between app and Excel structures
- `TournamentTracker.xlsx` - Reference Excel file with complete structure

---

## Completed Work (December 18, 2024)

### ✅ Medium Priority Features
1. **Full Birth Date Support**
   - Added `birthDay` field to Athlete model
   - Implemented single date picker in forms (EditAthleteForm, ProfileForm)
   - Maintains backward compatibility with existing birthMonth/birthYear

2. **Flexible Time Slots**
   - Changed from 30-minute to 15-minute increments
   - Added duration-based selection (15min to 4 hours)
   - Updated AddTimeSlotModal and GenerateTimeSlotsModal
   - Auto-calculated end times

3. **Individual Shooters Support**
   - Added `isIndividualTeam` and `tournamentId` to Team model
   - Created per-tournament individual teams
   - Auto-assigns teamless athletes during registration
   - Added TeamBadge component for visual distinction
   - Created `lib/individualTeamHelpers.ts`

4. **Permission Updates**
   - Restricted tournament creation to admins only
   - Removed coach access to Create Tournament

5. **Basic Comprehensive Export**
   - Created `ExportComprehensiveButton.tsx`
   - Created API endpoint `/api/tournaments/[id]/export-comprehensive`
   - Exports 3 sheets: Teams, Participants, Squad Assignments
   - **Note**: This is basic registration export, not score-ready yet

### Database Migrations Needed
```sql
-- Add to Team table
ALTER TABLE "Team" ADD COLUMN "isIndividualTeam" BOOLEAN DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "tournamentId" TEXT;

-- Add to Athlete table (already migrated)
ALTER TABLE "Athlete" ADD COLUMN "birthDay" INTEGER;
```

---

## Phase 1: Enhanced Export for Score Entry
**Goal**: Export Excel file that matches TournamentTracker.xlsx structure for offline score entry

### 1.1 Add Shooter ID Generation
**Files to modify:**
- `prisma/schema-postgres.prisma` - Add `shooterId` field to Athlete
- `lib/shooterIdHelpers.ts` - NEW: Generate format YY-XXXX
- Migration needed

**Tasks:**
- [ ] Add `shooterId String?` to Athlete model
- [ ] Create helper to generate shooter IDs (format: YY-XXXX where YY=year, XXXX=sequential)
- [ ] Backfill existing athletes with shooter IDs
- [ ] Display shooter IDs in athlete management UI

### 1.2 Add Squad Numbering
**Files to modify:**
- `prisma/schema-postgres.prisma` - Add `squadNumber` to Squad
- `lib/squadHelpers.ts` - NEW: Generate sequential squad numbers per tournament
- Migration needed

**Tasks:**
- [ ] Add `squadNumber Int?` to Squad model
- [ ] Generate sequential numbers when creating squads
- [ ] Update squad displays to show numbers

### 1.3 Enhance Export Structure
**Files to modify:**
- `app/tournaments/[id]/ExportComprehensiveButton.tsx` - Complete rewrite
- `app/api/tournaments/[id]/export-comprehensive/route.ts` - Add new sheets

**New Export Structure (6 sheets):**

#### Sheet 1: Tournament Setup (NEW)
```typescript
{
  Events: "Skeet" | "Trap" | "Sporting Clays",
  "Tournament Events": "X" if enabled,
  Fees: number // per discipline
}
```

#### Sheet 2: Team Setup (ENHANCED)
```typescript
{
  "Team ID": "T001",
  "Team Name": string,
  "Head Coach": string,
  "Email": string,
  "Team Affiliation": string
  // Add more contact fields as needed
}
```

#### Sheet 3: Individual Setup (ENHANCED)
```typescript
{
  "Shooter ID": "26-1000",
  "First Name": string,
  "Last Name": string,
  "Birthdate": Excel date number,
  "Sex": "M" | "F",
  "Contact Email": string,
  "Shooting Team": string,
  "Age Concurrent": division,
  "Skeet": "Y" | "N",
  "Trap": "Y" | "N",
  "Sporting Clays": "Y" | "N",
  "Skeet Class": class,
  "Trap Class": class,
  "Sporting Class": class
}
```

#### Sheet 4: Shooter-Squad Assignment (ENHANCED)
```typescript
{
  "Shooter ID": "26-1000",
  "Team": string,
  "First Name": string,
  "Last Name": string,
  "Full Name": string,
  "Concurrent": division,
  // Per discipline:
  "Skeet": "Skeet" | "",
  "Squad Position": number,
  "Shooting Time": "9:00",
  "Skeet Squad Key": "Team-Division-Skeet",
  "Skeet Squad #": number,
  // Repeat for Trap and Sporting Clays
}
```

#### Sheet 5: Tournament List (NEW - CRITICAL FOR SCORE ENTRY)
```typescript
{
  "Shooter ID": "26-1000",
  "First Name": string,
  "Last Name": string,
  "Full Name": string,
  "Sex": "M" | "F",
  "Shooting Team": string,
  "Age Concurrent": division,

  // Skeet columns
  "Skeet Squad #": number,
  "Skeet Squad": string,
  "Shooting Class": class,
  "Round 1": null, // EMPTY - to be filled
  "Round 2": null,
  "Round 3": null,
  "Round 4": null,
  "Total Score": formula,

  // Trap columns
  "Trap Squad #": number,
  "Trap Round 1": null,
  "Trap Round 2": null,
  "Trap Round 3": null,
  "Trap Round 4": null,
  "Trap Total": formula,

  // Sporting columns
  "Sporting Squad #": number,
  "Station 1": null,
  "Station 2": null,
  // ... Station 3-20
  "Sporting Total": formula
}
```

#### Sheet 6: Squad Listing (ENHANCED)
```typescript
{
  "Squad #": number,
  "Squad Key": "Team-Division-Discipline",
  "Team Name": string,
  "Concurrent": division,
  "Discipline": "Skeet" | "Trap" | "Sporting Clays",
  "Participant #1 ID": "26-1000",
  "Participant #1 Name": string,
  // ... Participants 2-5
}
```

**Tasks:**
- [ ] Implement Tournament Setup sheet export
- [ ] Enhance Team Setup export with full contact info
- [ ] Enhance Individual Setup with Y/N discipline flags and shooter IDs
- [ ] Enhance Shooter-Squad Assignment with all discipline columns
- [ ] **Implement Tournament List sheet** (most important for score entry)
- [ ] Enhance Squad Listing with fixed 5-position format
- [ ] Add Excel formulas for total score calculations
- [ ] Test export with sample data

---

## Phase 2: Score Data Model
**Goal**: Store round-by-round and station-by-station scores

### 2.1 Add Score Table
**Files to modify:**
- `prisma/schema-postgres.prisma`
- `prisma/schema-sqlite.prisma`

**New Model:**
```prisma
model Score {
  id              String   @id @default(cuid())
  shootId         String
  shoot           Shoot    @relation(fields: [shootId], references: [id], onDelete: Cascade)

  // One of these will be set depending on discipline
  roundNumber     Int?     // For Skeet/Trap: 1-4
  stationNumber   Int?     // For Sporting Clays: 1-20

  score           Int      // Score for this round/station
  maxScore        Int      // Maximum possible score (typically 25 for rounds, 5-10 for stations)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([shootId])
  @@index([shootId, roundNumber])
  @@index([shootId, stationNumber])
}

// Update Shoot model
model Shoot {
  // ... existing fields
  scores          Score[]  // Add this relation
  totalScore      Int      // Can be calculated from scores or stored directly
  tieBreaker      Int?     // Tie breaker score if needed
}
```

**Migration needed**

**Tasks:**
- [ ] Add Score model to schemas
- [ ] Add scores relation to Shoot model
- [ ] Add totalScore and tieBreaker fields to Shoot
- [ ] Create migration
- [ ] Update Shoot creation to support Score records

### 2.2 Update Score Entry UI
**Files to modify:**
- `app/tournaments/[id]/scores/enter/ScoreEntryForm.tsx` (if exists)
- Create new round-by-round entry forms

**Tasks:**
- [ ] Create RoundScoreEntry component for Skeet/Trap (4 rounds)
- [ ] Create StationScoreEntry component for Sporting (20 stations)
- [ ] Update score entry flow to save individual scores
- [ ] Calculate and display running totals
- [ ] Add validation (scores can't exceed max per round/station)

---

## Phase 3: Excel Score Import
**Goal**: Import Tournament List sheet after scores are entered

### 3.1 Create Import UI
**Files to create:**
- `app/tournaments/[id]/import-scores/page.tsx` - Import page
- `app/tournaments/[id]/ImportScoresButton.tsx` - Upload button component

**Tasks:**
- [ ] Create file upload interface
- [ ] Show preview of data before import
- [ ] Validation checks (shooter IDs match, no missing data)
- [ ] Import progress indicator

### 3.2 Create Import API
**Files to create:**
- `app/api/tournaments/[id]/import-scores/route.ts` - Import endpoint
- `lib/scoreImportHelpers.ts` - Parsing and validation logic

**Import Logic:**
```typescript
1. Parse uploaded Excel file
2. Read "Tournament List" sheet
3. For each row:
   a. Match shooter by Shooter ID
   b. Find corresponding Shoot records
   c. For each discipline:
      - Extract round/station scores
      - Validate scores (not null, within range)
      - Create Score records
      - Calculate total
      - Update Shoot.totalScore
4. Return import summary (success count, errors)
```

**Tasks:**
- [ ] Implement Excel file parsing (using xlsx library)
- [ ] Match shooters by Shooter ID
- [ ] Extract scores from correct columns based on discipline
- [ ] Validate score data (required fields, ranges, duplicates)
- [ ] Create Score records for each round/station
- [ ] Update Shoot totals
- [ ] Handle errors gracefully (partial imports, rollback on failure)
- [ ] Return detailed import report

### 3.3 Import Validation
**Validation checks:**
- [ ] File format is valid Excel
- [ ] Tournament List sheet exists
- [ ] All shooter IDs in file match registered shooters
- [ ] Scores are within valid ranges
- [ ] No duplicate score entries
- [ ] All required rounds/stations have scores (or are intentionally blank)

---

## Phase 4: Rankings & Leaderboard
**Goal**: Calculate and display comprehensive rankings

### 4.1 Add Ranking Table
**Files to modify:**
- `prisma/schema-postgres.prisma`
- `prisma/schema-sqlite.prisma`

**New Model:**
```prisma
model Ranking {
  id                String   @id @default(cuid())
  tournamentId      String
  tournament        Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  athleteId         String
  athlete           Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  disciplineId      String
  discipline        Discipline @relation(fields: [disciplineId], references: [id])

  // Scores
  totalScore        Int
  tieBreaker        Int?
  shootingAverage   Float?

  // Overall rankings
  overallRank       Int?     // HOA (High Over All)
  overallPlace      Int?

  // Division rankings (Age Concurrent)
  divisionRank      Int?
  divisionPlace     Int?

  // Class rankings (A, B, C, D)
  classRank         Int?
  classPlace        Int?

  // Team rankings
  teamRank          Int?
  teamPlace         Int?
  teamScore         Int?     // Athlete's contribution to team score

  // Gender rankings
  genderRank        Int?
  genderPlace       Int?

  calculatedAt      DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([tournamentId, athleteId, disciplineId])
  @@index([tournamentId, disciplineId])
  @@index([tournamentId, disciplineId, overallRank])
}
```

**Migration needed**

**Tasks:**
- [ ] Add Ranking model
- [ ] Create indexes for efficient queries

### 4.2 Implement Ranking Calculation
**Files to create:**
- `lib/rankingCalculator.ts` - Core ranking logic
- `app/api/tournaments/[id]/calculate-rankings/route.ts` - Trigger calculation

**Ranking Algorithm:**
```typescript
For each discipline in tournament:
  1. Get all shoots with scores
  2. Calculate totals and averages

  3. Overall (HOA) Rankings:
     - Sort by total score DESC
     - Assign ranks (handle ties with tie breaker)

  4. Division Rankings:
     - Group by athlete.division
     - Sort each group by score DESC
     - Assign division-specific ranks

  5. Class Rankings:
     - Group by athlete class for this discipline
     - Sort each group by score DESC
     - Assign class-specific ranks

  6. Team Rankings:
     - For each team:
       - Get top N scores (usually 5)
       - Sum for team score
     - Sort teams by team score DESC
     - Assign each athlete their team's rank

  7. Gender Rankings:
     - Group by athlete.gender
     - Sort by score DESC
     - Assign gender-specific ranks

  8. Determine Places (1st, 2nd, 3rd, etc.)
     - Places account for ties (two 1st place = next is 3rd)
```

**Tasks:**
- [ ] Implement overall ranking calculation
- [ ] Implement division ranking calculation
- [ ] Implement class ranking calculation
- [ ] Implement team ranking calculation (top 5 scores)
- [ ] Implement gender ranking calculation
- [ ] Handle tie-breaking logic
- [ ] Calculate places (vs ranks)
- [ ] Batch calculate all rankings for tournament
- [ ] Add API endpoint to trigger recalculation

### 4.3 Enhanced Leaderboard Display
**Files to modify:**
- `app/tournaments/[id]/leaderboard/page.tsx` - Complete redesign

**Leaderboard Features:**
```typescript
// Multiple views:
1. Overall (HOA) - All shooters ranked by score
2. By Division - Tabs for each division
3. By Class - Tabs for each class (A, B, C, D)
4. Team Standings - Teams ranked by total
5. By Gender - Male/Female rankings

// Each view shows:
- Place (1st, 2nd, 3rd)
- Shooter name
- Team
- Total score
- Tie breaker (if applicable)
- Round/station breakdown
```

**Tasks:**
- [ ] Create tabbed interface (Overall, Division, Class, Team, Gender)
- [ ] Display rankings from Ranking table
- [ ] Show score breakdowns (expand to see rounds/stations)
- [ ] Highlight top 3 places with colors
- [ ] Add filtering and search
- [ ] Make responsive for mobile
- [ ] Add export to PDF functionality
- [ ] Real-time updates when rankings recalculated

---

## Phase 5: Additional Enhancements

### 5.1 Captain Designation
**Files to modify:**
- `prisma/schema-postgres.prisma` - Add `isCaptain` to SquadMember
- Squad management UI

**Tasks:**
- [ ] Add `isCaptain Boolean @default(false)` to SquadMember
- [ ] Add captain toggle in squad assignment UI
- [ ] Display captain in exports and squad listings
- [ ] Migration needed

### 5.2 Fee Tracking
**Files to modify:**
- `prisma/schema-postgres.prisma` - Add fees to TournamentDiscipline
- Tournament creation form
- Registration flow

**Tasks:**
- [ ] Add `fee Decimal?` to TournamentDiscipline model
- [ ] Update tournament creation to set fees per discipline
- [ ] Calculate total fees during registration
- [ ] Display fees in registration confirmation
- [ ] Add payment tracking fields
- [ ] Migration needed

### 5.3 Discipline-Specific Classes
**Files to modify:**
- `prisma/schema-postgres.prisma` - Add class fields
- Athlete profile forms

**Current:** `nscaClass`, `ataClass` (global)
**Enhanced:** `skeetClass`, `trapClass`, `sportingClass` (discipline-specific)

**Tasks:**
- [ ] Add `skeetClass`, `trapClass`, `sportingClass` to Athlete
- [ ] Update profile forms to edit each class
- [ ] Map nscaClass/ataClass to specific disciplines
- [ ] Migration needed

### 5.4 Shooting Average Tracking
**Files to create:**
- Historical average calculation
- Display in athlete profiles

**Tasks:**
- [ ] Calculate shooting averages from past tournaments
- [ ] Store in Ranking or separate AverageScore table
- [ ] Display on athlete profiles
- [ ] Use for seeding/classification

---

## Testing Strategy

### Unit Tests
- [ ] Shooter ID generation
- [ ] Squad number generation
- [ ] Score calculation (totals from rounds/stations)
- [ ] Ranking algorithms (each type)
- [ ] Tie-breaking logic
- [ ] Excel parsing and validation

### Integration Tests
- [ ] Export complete tournament data
- [ ] Import scores from Excel
- [ ] Calculate rankings after import
- [ ] Display rankings on leaderboard
- [ ] Handle invalid import data

### End-to-End Tests
- [ ] Full workflow: Register → Export → Score → Import → View Leaderboard
- [ ] Multiple disciplines in one tournament
- [ ] Team scores with mixed team sizes
- [ ] Tie scenarios

---

## Deployment Checklist

### Before Each Phase
- [ ] Run all tests
- [ ] Create database migrations
- [ ] Test migrations on staging
- [ ] Update documentation
- [ ] Create backup of production database

### Phase Rollout
- [ ] Deploy to staging
- [ ] Test thoroughly on staging
- [ ] Get user feedback
- [ ] Fix any issues
- [ ] Deploy to production
- [ ] Monitor for errors

---

## Data Migration Notes

### For Existing Tournaments
When deploying Phase 2 (Score table):
- Existing Shoot records have total scores only
- Can backfill Score records if needed (create single "Total" score)
- Or leave historical data as-is and only use detailed scores for new tournaments

### For Existing Athletes
When deploying shooter IDs:
- Backfill script needed to generate shooter IDs for existing athletes
- Use creation year + sequential number
- Ensure no duplicates

---

## Future Considerations

### Performance
- Rankings calculation can be expensive for large tournaments
- Consider caching rankings
- Queue ranking calculations as background job
- Add "Calculating..." state in UI

### Real-time Updates
- WebSocket support for live leaderboard updates
- Push notifications when rankings change
- Live score entry during tournament

### Mobile App
- Offline score entry on tablets
- Sync scores when connection available
- Native Excel export/import on mobile

### Additional Features (Low Priority)
- Printable squad sheets
- Email notifications for squad assignments
- SMS reminders for shooting times
- Photo uploads for shooters
- Tournament brackets for shoot-offs
- Historical statistics and trends
- Coach analytics dashboard

---

## Questions to Resolve

1. **Class Assignment**: Should classes be per-discipline or global?
   - Current: Global (nscaClass, ataClass)
   - Excel has: Skeet Class, Trap Class, Sporting Class
   - Decision: TBD

2. **Team Scoring**: How many scores count toward team total?
   - Excel shows: Top 5 scores
   - Configurable per tournament?
   - Decision: TBD

3. **Concurrent/Division**: Are these the same concept?
   - Code uses: division
   - Excel uses: Age Concurrent (Novice, JV, Varsity, etc.)
   - Decision: They're the same, keep "division" in code

4. **Score Validation**: What are valid score ranges?
   - Per round: 0-25?
   - Per station: 0-10 for doubles, 0-5 for singles?
   - Need discipline-specific validation rules
   - Decision: TBD

5. **Import Strategy**: Replace or merge scores?
   - First import: Create scores
   - Subsequent imports: Replace existing scores or error?
   - Decision: TBD (suggest replace with confirmation)

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Export creates Excel file matching TournamentTracker.xlsx structure
- ✅ Tournament List sheet has empty score columns ready for entry
- ✅ All shooter IDs and squad numbers are generated correctly
- ✅ Export tested with real tournament data

### Phase 2 Complete When:
- ✅ Scores can be entered round-by-round or station-by-station in UI
- ✅ Score table stores individual round/station scores
- ✅ Total scores calculated correctly from component scores
- ✅ Existing scoring functionality still works

### Phase 3 Complete When:
- ✅ Excel file with scores can be uploaded
- ✅ Scores are parsed and validated correctly
- ✅ Import creates Score records for each round/station
- ✅ Import errors are handled gracefully with clear messages
- ✅ Import tested with real tournament data

### Phase 4 Complete When:
- ✅ Rankings calculated for all categories (overall, division, class, team, gender)
- ✅ Leaderboard displays all ranking categories
- ✅ Ties are handled correctly with tie-breakers
- ✅ Team scores calculated from top N performers
- ✅ Leaderboard matches Excel ranking sheets

### All Phases Complete When:
- ✅ Full workflow works end-to-end
- ✅ Users can complete tournament cycle without manual intervention
- ✅ Leaderboard shows accurate, comprehensive results
- ✅ System tested with real tournament (50+ shooters, multiple disciplines)
- ✅ Performance is acceptable (rankings calculate in <30s)

---

## Timeline Estimate

- **Phase 1 (Enhanced Export)**: 2-3 days
- **Phase 2 (Score Data Model)**: 2-3 days
- **Phase 3 (Import)**: 3-4 days
- **Phase 4 (Rankings)**: 4-5 days
- **Phase 5 (Enhancements)**: 2-3 days
- **Testing & Refinement**: 3-4 days

**Total**: ~3-4 weeks of focused development

---

## Notes
- This plan builds on completed medium-priority features (birth date, time slots, individual shooters)
- Excel file format is based on TournamentTracker.xlsx reference file
- Each phase can be deployed independently
- Phases 3-4 depend on Phase 2 (Score table)
- Phase 1 can be done independently and provides immediate value
