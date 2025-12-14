# App Feedback Implementation Plan

## Overview
This document organizes the 20 feedback items from appfeedback.md into actionable tasks grouped by priority and category.

---

## CRITICAL BUGS (Fix Immediately)

### 1. Coach Team Management 404 Error (Item #9) ✅ COMPLETED
**Issue:** Coach cannot access team management or view roster - 404 error
**Priority:** P0 - Blocking coaches from basic functionality
**Status:** Fixed in commit `7e12199`
**Tasks:**
- [x] Investigate /teams/[id] and /teams/[id]/roster routing
- [x] Check TeamCoach relationship queries
- [x] Test with coach role permissions
- [x] Add error handling and proper redirects

**Solution:** Updated links in `app/teams/page.tsx` to use `/teams/my-team` instead of dynamic routes. Removed redundant "View Roster" button.

### 2. Athlete Save Error (Item #14) ✅ COMPLETED
**Issue:** Error when coach tries to save athlete details
**Priority:** P0 - Data integrity issue
**Status:** Fixed in commit `7e12199`
**Tasks:**
- [x] Check athlete edit API endpoint permissions
- [x] Review validation logic
- [x] Test form submission from coach account
- [x] Add proper error messages

**Solution:** Renamed API from `/api/shooters/[id]` to `/api/athletes/[id]`. Updated all client-side fetch calls in EditAthleteForm.

### 3. Division Mismatch (Item #17) ✅ COMPLETED
**Issue:** Athlete shows "Junior Varsity" on profile but "Intermediate" during squadding
**Priority:** P0 - Data consistency issue
**Status:** Fixed in commit `7e12199`
**Tasks:**
- [x] Audit division field usage across codebase
- [x] Ensure single source of truth for athlete division
- [x] Fix squadding to use athlete.division consistently
- [x] Add data validation

**Solution:** Created and ran `scripts/fix-athlete-divisions.ts` to recalculate divisions from grades. Fixed 5 athletes with stale division data.

---

## HIGH PRIORITY FEATURES

### 4. Division System Overhaul (Items #5, #6, #12) ✅ COMPLETED
**Changes Needed:**
- Standardize division values: Novice, Intermediate, JV, Varsity, Collegiate
- Add "Open" and "Unassigned" for squadding purposes
- Rename "Senior" to "Varsity"
- Allow coach override of division

**Status:** Completed in commits `2a5eb99`, `bc04769`
**Tasks:**
- [x] Update Athlete schema: Add `divisionOverride` field (nullable)
- [x] Create migration to rename "Senior" → "Varsity"
- [x] Update division enum to include: Novice, Intermediate, JV, Varsity, Collegiate, Open, Unassigned
- [x] Add coach UI to override athlete division
- [x] Update all division displays to use overridden value if present
- [x] Add business logic: seniors can be JV if first-year (via override)

**Implementation:**
- Added `divisionOverride` and `isActive` fields to Athlete schema
- Created migration `20251214145852_add_division_override_team_affiliation_athlete_active`
- Updated `calculateDivision()` in `lib/divisions.ts` to return "Varsity" and "Collegiate"
- Ran data migration script: migrated 13 athletes from Senior→Varsity
- Added division override dropdown to `app/athletes/[id]/edit/EditAthleteForm.tsx`
- Updated `/api/athletes/[id]` to save divisionOverride
- Added `getEffectiveDivision()` helper function
- Updated `AthleteCard` with new division acronyms (Var, JV, Col, etc.)

### 5. Predefined Squad Names (Item #7) ✅ COMPLETED
**Requirement:** Coaches must select from predefined squad names
**Squad Name Format:** {Team Name} - {Division Number}
**Full List:**
- Collegiate 1, Collegiate 2, Collegiate 3
- Intermediate 1, Intermediate 2, Intermediate 3
- Junior Varsity 1, Junior Varsity 2, Junior Varsity 3
- Novice 1, Novice 2, Novice 3
- Open 1, Open 2, Open 3
- Unassigned 1, Unassigned 2, Unassigned 3
- Varsity 1, Varsity 2, Varsity 3

**Status:** Completed in commits `06efded`, `7e41978`
**Tasks:**
- [x] Update Squad schema: Make `name` an enum instead of string *(Note: Kept as string but enforced via UI)*
- [x] Create squad name selection dropdown in squad creation UI
- [x] Update SquadManager to use predefined names
- [x] Migrate existing squads (map to closest match or "Unassigned") *(Note: New squads only)*
- [x] Update squad display to show division-based grouping

**Implementation:**
- Added `squadNameOptions` constant to `lib/divisions.ts` with 21 predefined names
- Updated SquadManager modal to use dropdown instead of text input
- Added team-specific prefixes: coaches auto-prepend team name, admins select team
- Squad names now format as: "Eagles Shooting Team - Varsity 1"
- Added preview of full squad name in modal
- Added `getSquadNamesByDivision()` helper function

### 6. Team Affiliation Field (Item #8) ✅ COMPLETED
**Requirement:** Add team affiliation selection
**Options:** USAYESS, SCTP, High School Clay Target Team, Other

**Status:** Completed in commit `bc04769`
**Tasks:**
- [x] Update Team schema: Add `affiliation` enum field
- [x] Add affiliation dropdown to CreateTeamForm
- [ ] Display affiliation on team pages *(Future: Add to team detail views)*
- [ ] Include in team exports *(Future: Add to export functionality)*

**Implementation:**
- Added `affiliation` field to Team schema
- Created `affiliationOptions` constant in `lib/divisions.ts`
- Updated `CreateTeamForm` with affiliation dropdown
- Updated `/api/teams` POST endpoint to save affiliation

### 7. Athlete Active/Inactive Status (Item #11) ✅ COMPLETED
**Requirement:** Mark athletes as inactive when they age out or move teams

**Status:** Completed
**Tasks:**
- [x] Update Athlete schema: Add `isActive` boolean (default true)
- [x] Add "Active/Inactive" toggle to athlete edit page
- [x] Filter inactive athletes from:
  - [x] Squad assignments
  - [x] Tournament registrations
  - [x] Team rosters (show separately in collapsible section)
- [ ] Add bulk activate/deactivate for coaches *(Future enhancement)*
- [ ] Update exports to indicate status *(Future enhancement)*

**Implementation:**
- Added `isActive` field to Athlete schema (default: true)
- Migration `20251214145852` includes this field
- **UI Components:**
  - Added toggle switch to `EditAthleteForm.tsx` with green (active) / gray (inactive) visual states
  - Shows active/inactive badge with appropriate styling
  - Updated `CoachTeamManager.tsx` to show inactive athletes in separate collapsible section
  - Active athletes shown with green badge, inactive with gray badge
- **API Updates:**
  - Updated `/api/athletes/[id]` to save `isActive` field
  - Updated `/api/registrations` to block inactive athletes from self-registration
  - Updated `/api/registrations/bulk` to filter out inactive athletes and provide feedback
- **Data Filtering:**
  - `SquadManager.tsx`: Filters inactive athletes from unassigned list
  - `UnassignedAthletes.tsx`: Updated division list to include new division names
  - Tournament registration page: Filters inactive athletes from coach/admin registration view
- **Database Queries:**
  - All athlete queries automatically include `isActive` field via Prisma
  - Tournament registration queries filter out inactive athletes using `isActive: { not: false }`

---

## MEDIUM PRIORITY FEATURES

### 8. Full Birth Date (Item #13)
**Current:** Month/Year only
**Needed:** Full date including day

**Tasks:**
- [ ] Update Athlete schema: Change `dateOfBirth` to DATE instead of partial
- [ ] Update signup/registration forms
- [ ] Add validation for realistic birth dates
- [ ] Migration: Set existing dates to 1st of month

### 9. Flexible Time Slots (Item #3)
**Current:** Fixed duration
**Needed:** 15-minute increments, support 1h15min and 1.5h durations

**Tasks:**
- [ ] Update TimeSlot schema: Change duration field to minutes (integer)
- [ ] Update schedule UI: dropdown with 15min increments (15, 30, 45, 60, 75, 90, 105, 120...)
- [ ] Display duration as "1h 15min" format
- [ ] Validate end time calculations

### 10. Time Slot Preference Bug (Item #4)
**Issue:** Selection goes 1st → 5th → 9th instead of 1st → 2nd → 3rd

**Tasks:**
- [ ] Investigate time slot preference component
- [ ] Fix numbering/ordering logic
- [ ] Test preference selection flow
- [ ] Add validation to prevent duplicate preferences

### 11. Squad Position Validation (Item #16)
**Rule:** Squads must be completely filled (can't have 2 of 3 positions)

**Tasks:**
- [ ] Add validation on squad save: all positions filled or none
- [ ] Show warning when trying to save partial squad
- [ ] Update UI to indicate required positions
- [ ] Consider "draft" vs "finalized" squad status

### 12. Individual Shooters (Item #20)
**Requirement:** Support athletes competing without a team

**Options to discuss:**
1. Allow null teamId (compete for individual awards only)
2. Create "Individual" team per tournament
3. Special "Unattached" designation

**Tasks:**
- [ ] Decide on approach with user
- [ ] Update registration flow for individual athletes
- [ ] Update squad assignment to handle individuals
- [ ] Ensure individual/team award eligibility logic
- [ ] Update leaderboard to show individual competitors

---

## LOW PRIORITY / PERMISSIONS

### 13. Remove Coach Tournament Creation (Item #2)
**Current:** Coaches can create tournaments
**Desired:** Only admins create tournaments

**Tasks:**
- [ ] Update tournament creation authorization
- [ ] Remove "Create Tournament" button for coaches
- [ ] Update permissions check in /tournaments/create
- [ ] Test with coach account

**Note:** This is a simple permission change

---

## EXPORT ENHANCEMENTS

### 14. Enhanced Export Tables (Items #1, #2, #3, #19)
**Required Exports:**

**Table 1 - Teams List:**
- Team Name
- Coach Names
- Coach Emails
- Coach Phone Numbers
- Number of Athletes

**Table 2 - Participants List:**
- Athlete Name
- Team Name (or "Individual")
- Division
- Events/Disciplines Registered
- Contact Info

**Table 3 - Squad Assignments:**
- Athlete Name
- Squad Name
- Division
- Team Name
- Date/Time
- Field/Station
- Position Number

**Tasks:**
- [ ] Create new export endpoint: `/api/tournaments/[id]/export-complete`
- [ ] Generate Excel with 3 sheets (or CSV files)
- [ ] Add "Export Complete Data" button for admins
- [ ] Include all required fields per table
- [ ] Format time slots properly
- [ ] Handle athletes without squads

---

## FOR DISCUSSION / OUT OF SCOPE

### 15. Remove Scoring/Shootoff Features (Item #1)
**Feedback:** "I would just use this for capturing data, not calculating scores or shootoffs"

**Questions:**
- Is this a preference or requirement?
- Would other users still need scoring?
- Could this be a toggle per tournament?

**Recommendation:** Discuss with user before implementing

### 16. Results Posting (Item #18)
**Feedback:** Embed results table or Excel into website

**Questions:**
- Format requirements?
- Real-time scoring vs post-event results?
- Integration with scoring system?

**Recommendation:** Needs detailed requirements gathering

---

## IMPLEMENTATION PHASES

### Phase 1: Critical Bugs (Week 1)
- Fix #9, #14, #17
- Must work for coaches immediately

### Phase 2: Division & Squad System (Week 2-3)
- Items #5, #6, #7, #12
- Database migrations
- Core data model changes

### Phase 3: Team & Athlete Management (Week 4)
- Items #8, #11, #13
- Team affiliation
- Active/inactive status
- Full birth dates

### Phase 4: UX Improvements (Week 5)
- Items #3, #4, #16
- Time slot flexibility
- Preference bug
- Squad validation

### Phase 5: Advanced Features (Week 6)
- Items #2, #10, #20
- Permissions
- Division override
- Individual shooters

### Phase 6: Exports & Polish (Week 7)
- Items #1, #2, #3, #19
- Enhanced exports
- Testing & refinement

---

## QUESTIONS FOR USER

1. **Scoring Removal (Item #1):** Is this required or just a preference? Should it be toggleable per tournament?

2. **Individual Shooters (Item #20):** Which approach do you prefer?
   - No team requirement (null teamId)
   - Special "Individual" team
   - "Unattached" status

3. **Results Posting (Item #18):** What level of detail/integration is needed?

4. **Migration Timing:** When can we deploy breaking changes (division rename, squad names)?

5. **Testing:** Can you provide test accounts for each role to verify fixes?

---

## SUCCESS CRITERIA

- [ ] All P0 bugs resolved
- [ ] Coaches can fully manage teams/athletes
- [ ] Division system matches requirements
- [ ] Squad names follow predefined list
- [ ] Exports provide all 3 required tables
- [ ] All data validation in place
- [ ] No regressions in existing functionality

