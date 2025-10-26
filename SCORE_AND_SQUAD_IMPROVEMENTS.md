# Score Validation & Squad Auto-Assign Improvements

## Summary

Two major improvements have been implemented to enhance data integrity and user experience:

1. **Score Validation**: Prevents scores from exceeding tournament-configured target limits
2. **Discipline-Specific Auto-Assign**: Auto-assign now defaults to the active discipline only

---

## 1. Score Validation

### Problem
Coaches could enter scores that exceeded the maximum number of targets configured for a tournament, leading to invalid data.

### Solution
Added comprehensive validation that:
- Calculates the maximum possible score based on tournament discipline configuration
- Validates scores before saving
- Provides visual feedback when scores exceed limits
- Prevents saving invalid scores with clear error messages

### Implementation Details

#### Maximum Score Calculation

**Trap/Skeet:**
```
Max Score = Number of Rounds × 25 targets per round
Example: 4 rounds × 25 = 100 targets maximum
```

**Sporting Clays:**
```
Max Score = Total targets configured for tournament
Example: 100 targets configured = 100 maximum
```

**5-Stand:**
```
Max Score = Total targets configured for tournament
Example: 50 targets configured = 50 maximum
```

#### Visual Indicators

**Normal Score (within limits):**
- Total cell: Blue background (`bg-indigo-50`)
- Text: Indigo color (`text-indigo-900`)

**Exceeds Limit:**
- Total cell: Red background (`bg-red-100`)
- Text: Red color (`text-red-700`)
- Shows "Max: X" below the total

#### Error Messages

When attempting to save scores that exceed limits:
```
Cannot save scores. The following shooter(s) have scores exceeding 
the tournament limit of 100 targets:

John Doe (105/100)
Jane Smith (102/100)

Please correct the scores before saving.
```

### Files Modified

- `app/tournaments/[id]/scores/page.tsx`
  - Pass tournament data with discipline configurations

- `app/tournaments/[id]/scores/ScoreEntry.tsx`
  - Added `getMaxPossibleScore()` function
  - Added validation in `handleSaveScores()`
  - Updated total cell rendering with conditional styling
  - Added visual indicators for invalid scores

### User Experience

1. **Real-time Visual Feedback**
   - As coaches enter scores, totals update immediately
   - Red highlighting appears when limit is exceeded
   - Clear indication of the maximum allowed

2. **Prevention of Invalid Data**
   - Save button remains enabled (for UX)
   - Error message displays when save is attempted
   - Must correct scores before saving succeeds

3. **Clear Communication**
   - Error messages list all shooters with invalid scores
   - Shows actual score vs. maximum allowed
   - Instructs user to correct before saving

---

## 2. Discipline-Specific Auto-Assign

### Problem
Auto-assign would assign shooters to squads across ALL disciplines, even when the user was only viewing/managing one specific discipline. This could lead to:
- Unintended assignments in other disciplines
- Confusion about which discipline was being managed
- Difficulty organizing one discipline at a time

### Solution
Auto-assign now:
- Defaults to assigning only for the currently active discipline
- Includes a toggle to enable cross-discipline assignment if desired
- Clearly communicates which discipline(s) will be affected

### Implementation Details

#### New Option: "Auto-assign across all disciplines"

**Default State:** `false` (unchecked)
- Only assigns shooters to squads in the active discipline
- Respects the user's current context

**When Enabled:** `true` (checked)
- Assigns shooters to squads across all disciplines
- Behaves like the previous version

#### Backend Filtering

**API Route Changes:**
```typescript
interface AutoAssignOptions {
  // ... existing options ...
  activeDisciplineId?: string | null
}

// Filter time slots by discipline
const timeSlotWhere: any = { tournamentId }
if (options.activeDisciplineId) {
  timeSlotWhere.disciplineId = options.activeDisciplineId
}

// Filter shooters by discipline
if (options.activeDisciplineId && disciplineId !== options.activeDisciplineId) {
  continue // Skip this discipline
}
```

### Files Modified

- `app/tournaments/[id]/squads/SquadManager.tsx`
  - Added `autoAssignAcrossDisciplines` to state (default: `false`)
  - Updated `handleConfirmAutoAssign()` to pass `activeDisciplineId`
  - Added new toggle in auto-assign modal
  - Dynamic description shows which discipline(s) will be affected

- `app/api/tournaments/[id]/auto-assign-squads/route.ts`
  - Added `activeDisciplineId` to `AutoAssignOptions` interface
  - Filter time slots by `activeDisciplineId` when specified
  - Skip disciplines that don't match `activeDisciplineId`

### User Experience

#### Modal Display

**When "Auto-assign across all disciplines" is OFF (default):**
```
☐ Auto-assign across all disciplines
Will only assign shooters to squads in Trap
```

**When "Auto-assign across all disciplines" is ON:**
```
☑ Auto-assign across all disciplines
Will assign shooters to squads in all disciplines
```

#### Workflow

1. **Coach navigates to Squads page**
2. **Selects "Trap" from discipline tabs**
3. **Clicks "Auto-Assign Squads"**
4. **Modal opens with options**
   - By default, will only assign for Trap
   - Can check "Auto-assign across all disciplines" to assign for all
5. **Clicks "Confirm"**
6. **Only Trap squads are created** (unless cross-discipline was enabled)

---

## Benefits

### Score Validation

✅ **Data Integrity**
- Prevents invalid scores from being saved
- Ensures leaderboards and statistics are accurate
- Catches data entry errors immediately

✅ **User Guidance**
- Clear visual feedback during entry
- Helpful error messages
- Prevents frustration from silent failures

✅ **Tournament Flexibility**
- Respects custom tournament configurations
- Works with all disciplines
- Adapts to different round/target counts

### Discipline-Specific Auto-Assign

✅ **Better Control**
- Coaches can organize one discipline at a time
- No accidental assignments in other disciplines
- Clear about what will happen

✅ **Flexibility**
- Can still assign across all disciplines if desired
- Toggle is easy to understand and use
- Respects user's current context

✅ **Reduced Errors**
- Less likely to create unintended squads
- Easier to manage complex tournaments
- More predictable behavior

---

## Testing Checklist

### Score Validation

- [ ] Enter scores for Trap (4 rounds × 25 = 100 max)
  - [ ] Enter valid scores (≤100)
  - [ ] Enter invalid scores (>100)
  - [ ] Verify red highlighting appears
  - [ ] Verify error message on save
  - [ ] Verify cannot save invalid scores

- [ ] Enter scores for Skeet (4 rounds × 25 = 100 max)
  - [ ] Same tests as Trap

- [ ] Enter scores for Sporting Clays (custom targets, e.g., 100)
  - [ ] Enter valid scores (≤100)
  - [ ] Enter invalid scores (>100)
  - [ ] Verify validation works

- [ ] Enter scores for 5-Stand (custom targets, e.g., 50)
  - [ ] Enter valid scores (≤50)
  - [ ] Enter invalid scores (>50)
  - [ ] Verify validation works

- [ ] Test with different tournament configurations
  - [ ] 2 rounds of Trap (max 50)
  - [ ] 3 rounds of Skeet (max 75)
  - [ ] 75 targets Sporting Clays
  - [ ] 100 targets 5-Stand

### Discipline-Specific Auto-Assign

- [ ] Create tournament with multiple disciplines (Trap, Skeet, Sporting Clays)
- [ ] Create time slots for each discipline
- [ ] Register shooters for all disciplines
- [ ] Navigate to Squads page

- [ ] Test Default Behavior (cross-discipline OFF)
  - [ ] Select "Trap" discipline tab
  - [ ] Click "Auto-Assign Squads"
  - [ ] Verify modal shows "Will only assign shooters to squads in Trap"
  - [ ] Confirm auto-assign
  - [ ] Verify only Trap squads were created
  - [ ] Verify Skeet and Sporting Clays have no squads

- [ ] Test Cross-Discipline Assignment (cross-discipline ON)
  - [ ] Clear all squads
  - [ ] Select "Trap" discipline tab
  - [ ] Click "Auto-Assign Squads"
  - [ ] Check "Auto-assign across all disciplines"
  - [ ] Verify modal shows "Will assign shooters to squads in all disciplines"
  - [ ] Confirm auto-assign
  - [ ] Verify squads were created for Trap, Skeet, AND Sporting Clays

- [ ] Test with Single Discipline Tournament
  - [ ] Create tournament with only Trap
  - [ ] Verify auto-assign works normally
  - [ ] Toggle should still work but have no effect

---

## Migration Notes

### No Database Changes Required
Both features work with existing database schema.

### No Breaking Changes
- Score validation is additive (prevents bad data, doesn't affect existing data)
- Auto-assign defaults to safer behavior (single discipline)
- Existing functionality is preserved with the toggle

### Backward Compatibility
- Existing scores are not affected
- Existing squads are not affected
- API accepts new optional parameter but works without it

---

## Future Enhancements

### Score Validation
- [ ] Add warning (not error) at 90% of maximum
- [ ] Show running total as scores are entered
- [ ] Add "undo" button for recent changes
- [ ] Export validation report

### Auto-Assign
- [ ] Remember user's preference for cross-discipline toggle
- [ ] Add "preview" mode to see assignments before confirming
- [ ] Allow selecting specific disciplines (not just all or one)
- [ ] Add "balance squads" option to even out squad sizes

---

## Version Information

**Implemented:** October 2025
**Version:** 2.1
**Status:** ✅ Complete and Ready for Testing

---

## Support

For questions or issues:
1. Review this documentation
2. Check the testing checklist
3. Verify tournament discipline configurations
4. Contact development team

