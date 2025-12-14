# App Feedback Implementation Plan

## Overview
This document organizes the 20 feedback items from appfeedback.md into actionable tasks grouped by priority and category.

---

## CRITICAL BUGS (Fix Immediately)

### 1. Coach Team Management 404 Error (Item #9)
**Issue:** Coach cannot access team management or view roster - 404 error
**Priority:** P0 - Blocking coaches from basic functionality
**Tasks:**
- [ ] Investigate /teams/[id] and /teams/[id]/roster routing
- [ ] Check TeamCoach relationship queries
- [ ] Test with coach role permissions
- [ ] Add error handling and proper redirects

### 2. Athlete Save Error (Item #14)
**Issue:** Error when coach tries to save athlete details
**Priority:** P0 - Data integrity issue
**Tasks:**
- [ ] Check athlete edit API endpoint permissions
- [ ] Review validation logic
- [ ] Test form submission from coach account
- [ ] Add proper error messages

### 3. Division Mismatch (Item #17)
**Issue:** Athlete shows "Junior Varsity" on profile but "Intermediate" during squadding
**Priority:** P0 - Data consistency issue
**Tasks:**
- [ ] Audit division field usage across codebase
- [ ] Ensure single source of truth for athlete division
- [ ] Fix squadding to use athlete.division consistently
- [ ] Add data validation

---

## HIGH PRIORITY FEATURES

### 4. Division System Overhaul (Items #5, #6, #12)
**Changes Needed:**
- Standardize division values: Novice, Intermediate, JV, Varsity, Collegiate
- Add "Open" and "Unassigned" for squadding purposes
- Rename "Senior" to "Varsity"
- Allow coach override of division

**Tasks:**
- [ ] Update Athlete schema: Add `divisionOverride` field (nullable)
- [ ] Create migration to rename "Senior" → "Varsity"
- [ ] Update division enum to include: Novice, Intermediate, JV, Varsity, Collegiate, Open, Unassigned
- [ ] Add coach UI to override athlete division
- [ ] Update all division displays to use overridden value if present
- [ ] Add business logic: seniors can be JV if first-year

**Database Migration:**
```prisma
enum Division {
  NOVICE
  INTERMEDIATE
  JUNIOR_VARSITY
  VARSITY      // Previously SENIOR
  COLLEGIATE
  OPEN         // For squadding
  UNASSIGNED   // For squadding
}

model Athlete {
  division         Division
  divisionOverride Division?  // Coach can override
}
```

### 5. Predefined Squad Names (Item #7)
**Requirement:** Coaches must select from predefined squad names
**Squad Name Format:** {Division} {Number}
**Full List:**
- Collegiate 1, Collegiate 2, Collegiate 3
- Intermediate 1, Intermediate 2, Intermediate 3
- Junior Varsity 1, Junior Varsity 2, Junior Varsity 3
- Novice 1, Novice 2, Novice 3
- Open 1, Open 2, Open 3
- Unassigned 1, Unassigned 2, Unassigned 3
- Varsity 1, Varsity 2, Varsity 3

**Tasks:**
- [ ] Update Squad schema: Make `name` an enum instead of string
- [ ] Create squad name selection dropdown in squad creation UI
- [ ] Update SquadManager to use predefined names
- [ ] Migrate existing squads (map to closest match or "Unassigned")
- [ ] Update squad display to show division-based grouping

### 6. Team Affiliation Field (Item #8)
**Requirement:** Add team affiliation selection
**Options:** USAYESS, SCTP, High School Clay Target Team, Other

**Tasks:**
- [ ] Update Team schema: Add `affiliation` enum field
- [ ] Add affiliation dropdown to CreateTeamForm
- [ ] Display affiliation on team pages
- [ ] Include in team exports

### 7. Athlete Active/Inactive Status (Item #11)
**Requirement:** Mark athletes as inactive when they age out or move teams

**Tasks:**
- [ ] Update Athlete schema: Add `isActive` boolean (default true)
- [ ] Add "Active/Inactive" toggle to athlete edit page
- [ ] Filter inactive athletes from:
  - Squad assignments
  - Tournament registrations
  - Team rosters (show separately or hide)
- [ ] Add bulk activate/deactivate for coaches
- [ ] Update exports to indicate status

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

