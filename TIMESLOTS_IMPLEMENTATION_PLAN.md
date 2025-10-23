# 📅 Multi-Day Tournaments & Time Slots - Implementation Plan

## ✅ **Phase 1: Database Schema** (COMPLETED)

### What's Done:
- ✅ Changed Tournament from single `date` to `startDate` + `endDate`
- ✅ Created `TimeSlot` model with:
  - Tournament & Discipline associations
  - Date, start time, end time
  - Squad capacity
  - Field number (for skeet/trap)
  - Station number (for sporting clays)
- ✅ Created `Squad` model
- ✅ Migrated existing tournaments (date copied to both start and end)
- ✅ Generated Prisma client

---

## 🚧 **Phase 2: Update Existing Code** (IN PROGRESS)

### What Needs Updating:
These files reference the old `date` field and need to be updated to use `startDate`/`endDate`:

1. **Tournament Creation**
   - ❌ `app/tournaments/create/CreateTournamentForm.tsx` - Change single date to start/end dates
   - ❌ `app/api/tournaments/route.ts` - Update to handle startDate/endDate

2. **Tournament Display**
   - ❌ `app/page.tsx` (Home) - Show date range instead of single date
   - ❌ `app/tournaments/[id]/page.tsx` - Display date range

3. **Tournament Editing**
   - ❌ `app/tournaments/[id]/edit/page.tsx` - Update form for date range
   - ❌ `app/tournaments/[id]/edit/EditTournamentForm.tsx` - Two date fields
   - ❌ `app/api/tournaments/[id]/route.ts` - Handle startDate/endDate

---

## 🎯 **Phase 3: Time Slot Management** (TODO)

### Features to Build:

#### A. Smart Time Slot Generation
**Location**: `app/tournaments/[id]/schedule/page.tsx`

**UI Flow**:
```
1. Admin clicks "Manage Schedule"
2. For each discipline:
   - Select date (from tournament startDate to endDate)
   - Set start time (hour/half-hour increments)
   - Set end time  
   - Set duration per slot (30min, 1hr, 2hrs)
   - Set squad capacity (default 5)
   - Add field/station number
   - Click "Generate Slots"
3. System creates time slots automatically
4. Admin can then add/edit/remove individual slots
```

**Smart Generation Algorithm**:
```javascript
function generateTimeSlots(config) {
  const { 
    date, 
    startTime, // "08:00"
    endTime,   // "17:00"
    slotDuration, // 120 minutes
    squadCapacity,
    disciplineId,
    fieldNumber,
    stationNumber
  } = config
  
  const slots = []
  let currentTime = parseTime(startTime)
  const end = parseTime(endTime)
  
  while (currentTime < end) {
    const slotEnd = addMinutes(currentTime, slotDuration)
    if (slotEnd <= end) {
      slots.push({
        date,
        startTime: formatTime(currentTime),
        endTime: formatTime(slotEnd),
        squadCapacity,
        disciplineId,
        fieldNumber,
        stationNumber
      })
    }
    currentTime = slotEnd
  }
  
  return slots
}
```

#### B. Time Slot Display
**Components**:
- Day tabs (one tab per tournament day)
- Discipline filter
- Time slot cards showing:
  - Time range
  - Field/Station number
  - Capacity
  - Number of squads
  - Edit/Delete buttons

#### C. Manual Time Slot Management
- Add single slot
- Edit slot
- Delete slot  
- Duplicate slot
- Bulk delete

---

## 📊 **Phase 4: Squad Management** (TODO)

Once time slots exist, admins/coaches can create squads:

**Features**:
- View time slots for a discipline
- Click time slot to add squad
- Name squad (Squad A, Squad 1, etc.)
- Set capacity (default from time slot)
- Later: Assign shooters to squads

---

## 🎨 **UI Mockup**

### Schedule Management Page

```
Tournament: Spring Championship 2025
March 15-17, 2025

[Manage Schedule Button]

┌─────────────────────────────────────────────┐
│ SCHEDULE                                    │
├─────────────────────────────────────────────┤
│ [Day 1: Mar 15] [Day 2: Mar 16] [Day 3: Mar 17] │
├─────────────────────────────────────────────┤
│ Filter: [All Disciplines ▼]                │
├─────────────────────────────────────────────┤
│                                             │
│ Sporting Clays - Station 1                 │
│ ┌───────────────────────────────────────┐  │
│ │ 08:00 - 10:00                         │  │
│ │ Capacity: 5 shooters/squad            │  │
│ │ Squads: 0/∞                           │  │
│ │ [Edit] [Delete]  [Add Squad]          │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │ 10:00 - 12:00                         │  │
│ │ Capacity: 5 shooters/squad            │  │
│ │ Squads: 2 (Squad A, Squad B)          │  │
│ │ [Edit] [Delete]  [View Squads]        │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ Skeet - Field 1                            │
│ ┌───────────────────────────────────────┐  │
│ │ 08:00 - 09:00                         │  │
│ │ Capacity: 5 shooters/squad            │  │
│ │ Squads: 0/∞                           │  │
│ │ [Edit] [Delete]  [Add Squad]          │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ [+ Add Time Slot] [Generate Slots]        │
└─────────────────────────────────────────────┘
```

### Generate Time Slots Modal

```
┌─────────────────────────────────────────────┐
│ Generate Time Slots                         │
├─────────────────────────────────────────────┤
│                                             │
│ Discipline: [Sporting Clays ▼]             │
│ Date: [March 15, 2025 ▼]                   │
│                                             │
│ Start Time: [08:00 ▼]                      │
│ End Time:   [17:00 ▼]                      │
│                                             │
│ Slot Duration: [⚪ 30min ⚪ 1hr ● 2hrs]     │
│                                             │
│ Squad Capacity: [5]                         │
│                                             │
│ ⚪ Skeet/Trap                               │
│    Field Number: [Field 1]                 │
│                                             │
│ ● Sporting Clays                           │
│    Station Number: [Station 1]             │
│                                             │
│ Preview: Will create 5 time slots:         │
│  • 08:00 - 10:00                           │
│  • 10:00 - 12:00                           │
│  • 12:00 - 14:00                           │
│  • 14:00 - 16:00                           │
│  • 16:00 - 17:00 (1hr slot)                │
│                                             │
│ [Generate Slots]  [Cancel]                 │
└─────────────────────────────────────────────┘
```

---

## 📁 **Files to Create**

### API Routes
1. `app/api/tournaments/[id]/timeslots/route.ts`
   - GET - List all time slots
   - POST - Create time slot(s)

2. `app/api/timeslots/[id]/route.ts`
   - PUT - Update time slot
   - DELETE - Delete time slot

3. `app/api/timeslots/generate/route.ts`
   - POST - Smart generation

4. `app/api/timeslots/[id]/squads/route.ts`
   - GET - List squads for time slot
   - POST - Create squad

5. `app/api/squads/[id]/route.ts`
   - PUT - Update squad
   - DELETE - Delete squad

### Pages & Components
1. `app/tournaments/[id]/schedule/page.tsx` - Schedule management page
2. `app/tournaments/[id]/schedule/TimeSlotCard.tsx` - Time slot display
3. `app/tournaments/[id]/schedule/GenerateTimeSlotsModal.tsx` - Generation UI
4. `app/tournaments/[id]/schedule/AddTimeSlotModal.tsx` - Manual add
5. `app/tournaments/[id]/schedule/EditTimeSlotModal.tsx` - Edit
6. `app/tournaments/[id]/schedule/SquadList.tsx` - Squad management
7. `lib/timeSlotUtils.ts` - Helper functions

---

## 🔧 **Helper Functions Needed**

```typescript
// lib/timeSlotUtils.ts

export function generateTimeSlots(config: GenerateConfig): TimeSlot[]

export function formatTimeRange(start: string, end: string): string
// "08:00 - 10:00"

export function getHourOptions(): Array<{value: string, label: string}>
// ["08:00", "08:30", "09:00", ...

export function validateTimeSlot(slot: TimeSlot): ValidationResult

export function groupSlotsByDiscipline(slots: TimeSlot[]): Map<string, TimeSlot[]>

export function sortSlotsByDateTime(slots: TimeSlot[]): TimeSlot[]
```

---

## 🎯 **Implementation Priority**

### Immediate (Phase 2):
1. ✅ Update tournament creation for date range
2. ✅ Update tournament display to show date range  
3. ✅ Update tournament editing for date range

### Next (Phase 3A):
4. Create schedule management page
5. Build time slot generation UI
6. Implement generation API
7. Add manual time slot management

### Then (Phase 3B):
8. Time slot display and filtering
9. Edit/delete time slots
10. Field/station number management

### Finally (Phase 4):
11. Squad creation UI
12. Squad management
13. Future: Assign shooters to squads

---

## 💡 **Key Decisions**

### Time Format
- **Storage**: "HH:MM" (24-hour format)
- **Display**: User preference (12h/24h)
- **Increments**: :00 and :30 only

### Capacity Logic
- Time slots have `squadCapacity` (shooters per squad)
- Squads can override capacity
- No limit on number of squads per time slot

### Field vs Station
- Skeet/Trap use "Field Number" (Field 1, 2, 3...)
- Sporting Clays use "Station Number" (Station 1, 2, 3...)
- Determined by discipline type

### Validation Rules
- End time must be after start time
- Dates must be within tournament range
- No overlapping slots for same field/station
- At least 30min slots

---

## 🚀 **Current Status**

✅ **Database**: Complete  
🚧 **Existing Code Updates**: Starting now  
⏳ **Time Slot Management**: Pending  
⏳ **Squad Management**: Pending

---

## 📝 **Notes**

This is a significant feature that touches many parts of the application. It will take time to implement properly. The plan above breaks it into manageable phases.

**Estimated Implementation Time**: 4-6 hours total
- Phase 2: 1 hour
- Phase 3: 2-3 hours  
- Phase 4: 1-2 hours

**Testing Considerations**:
- Edge cases (single-day tournaments, all-day events)
- Time zone handling
- Capacity calculations
- Conflict detection

**Future Enhancements**:
- Shooter assignment to squads
- Squad rotation/scheduling
- Auto-assignment based on discipline registration
- Squad check-in system
- Real-time availability

