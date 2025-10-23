# 🏆 Team-Only Squads & Squad Classification - Complete

## ✅ **All Features Implemented!**

This document outlines the new team-only squad feature and automatic squad classification system.

---

## 🚀 **New Features**

### **1. Team-Only Squads** 🔒
Coaches can now designate squads as "team-only" to ensure only members from the same team can be added.

#### **How It Works**
- Each squad has a **Team-Only toggle** (checkbox)
- When enabled:
  - ✅ Only shooters from the same team can be added
  - ❌ Shooters from other teams are blocked
  - ❌ Shooters without a team are blocked
- When disabled:
  - ✅ Any shooter can be added (normal behavior)

#### **UI Location**
The toggle appears in the squad card header:
```
┌─────────────────────────────────────────┐
│ Squad A    (3/5)                    🗑️  │
│ 🏆 Division  RMCB - Senior  Team Only:☑️│
├─────────────────────────────────────────┤
│ [John] [Jane] [Bob]                     │
└─────────────────────────────────────────┘
```

#### **Enforcement**
When trying to add a shooter to a team-only squad:
1. System checks if squad has existing members
2. Compares new shooter's team with existing members' team
3. If different team → **Error**: "This is a team-only squad for [TeamName]"
4. If no team → **Error**: "This shooter must be on a team to join"
5. If same team → ✅ Allowed

---

### **2. Squad Classification** 🏷️
Squads are automatically classified as **Division** or **Open** based on their members.

#### **Classification Types**

**🏆 Division Squad**
- All members from **same team**
- All members in **same division**
- Ideal for competitive scoring
- Purple badge display

**🌐 Open Squad**
- Mixed teams, OR
- Mixed divisions, OR
- Both
- Standard competitive format
- Gray badge display

#### **Auto-Detection**
The system automatically detects squad type:
```typescript
// Division: All same team AND same division
Team: RMCB, RMCB, RMCB
Division: Senior, Senior, Senior
→ 🏆 Division Squad: RMCB - Senior

// Open: Mixed teams
Team: RMCB, Hawks, Eagles
→ 🌐 Open Squad

// Open: Mixed divisions  
Team: RMCB, RMCB, RMCB
Division: Senior, Junior, Intermediate
→ 🌐 Open Squad

// Open: Empty squad
Members: []
→ 🌐 Open Squad (default)
```

#### **Display**
The classification badge appears automatically in the squad header:
- **Division Squad**: `🏆 Division` (purple badge) + team name + division
- **Open Squad**: `🌐 Open` (gray badge)

---

### **3. Time Overlap Blocking** ❌
Changed from warning to hard block for time conflicts.

#### **Previous Behavior**
- ⚠️ Warning dialog
- "Continue anyway?" option
- Could still assign

#### **New Behavior**
- ❌ Error dialog
- No option to proceed
- Must remove from conflicting squad first

#### **Error Message**
```
❌ CANNOT ASSIGN - TIME CONFLICT

This shooter is already assigned to:
• Trap - 08:00 to 10:00 (Squad A)

These times overlap with 09:00 to 11:00.

Please remove the shooter from the conflicting 
squad first.

[OK]
```

---

## 🎨 **UI Components**

### **Squad Card Header** (Updated)
```
┌──────────────────────────────────────────────────┐
│ Squad A    (3/5)                             🗑️  │
├──────────────────────────────────────────────────┤
│ 🏆 Division  RMCB - Senior  🔒 Team Only        │
│                             Team Only: ☑️        │
├──────────────────────────────────────────────────┤
│ [John Doe] [Jane Smith] [Bob Wilson]            │
└──────────────────────────────────────────────────┘
```

### **Badge Colors**
- **🏆 Division**: Purple background, purple text, purple border
- **🌐 Open**: Gray background, gray text, gray border
- **🔒 Team Only**: Blue background, blue text, blue border

### **Toggle Position**
- Located in squad header
- Right side below squad name
- Label: "Team Only:"
- Checkbox control

---

## 📋 **Database Changes**

### **Schema Update**
```prisma
model Squad {
  id         String   @id @default(cuid())
  timeSlotId String
  name       String
  capacity   Int      @default(5)
  teamOnly   Boolean  @default(false)  // ← NEW FIELD
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  timeSlot TimeSlot      @relation(...)
  members  SquadMember[]
}
```

### **Migration Applied**
```sql
ALTER TABLE Squad ADD COLUMN teamOnly INTEGER NOT NULL DEFAULT 0;
```

---

## 🔧 **Technical Implementation**

### **Files Modified**

**1. `prisma/schema.prisma`**
- Added `teamOnly` Boolean field to Squad model

**2. `lib/squadUtils.ts`** (NEW UTILITIES)
```typescript
// Squad classification
export function classifySquad(members): SquadClassification {
  // Check if all same team AND same division
  const teams = new Set(members.map(m => m.shooter.teamId))
  const divisions = new Set(members.map(m => m.shooter.division))
  
  if (teams.size === 1 && divisions.size === 1) {
    return { type: 'division', team: ..., division: ... }
  }
  return { type: 'open', team: null, division: null }
}

// Badge styling
export function getSquadTypeBadge(type: SquadType): string

// Label formatting
export function formatSquadClassification(classification): string
```

**3. `app/tournaments/[id]/squads/SquadCard.tsx`**
- Added team-only toggle
- Added squad classification display
- Added `handleToggleTeamOnly()` function
- Updated UI to show badges

**4. `app/api/squads/[id]/route.ts`**
- Added `teamOnly` parameter to PUT endpoint
- Updates squad.teamOnly field

**5. `app/api/squads/[id]/members/route.ts`**
- Added team-only enforcement logic
- Checks team match before adding member
- Returns error if team doesn't match

**6. `app/tournaments/[id]/squads/SquadManager.tsx`**
- Changed overlap detection from warning to error
- Blocks assignment instead of allowing override

---

## 🎯 **User Workflows**

### **Creating a Team-Only Squad**
```
1. Create squad normally
2. Check "Team Only" toggle
3. Add first shooter (any team)
4. Try to add shooter from different team
5. ❌ Error: "This is a team-only squad for [Team]"
6. Add shooter from same team
7. ✅ Success!
```

### **Viewing Squad Classification**
```
1. Go to squad management
2. Look at any squad with members
3. See classification badge:
   - 🏆 Division: All same team & division
   - 🌐 Open: Mixed
4. Badge updates automatically as you add/remove members
```

### **Handling Time Conflicts**
```
1. Assign shooter to 08:00-10:00 squad
2. Try to assign to 09:00-11:00 squad
3. ❌ Error: "CANNOT ASSIGN - TIME CONFLICT"
4. Must remove from first squad
5. Then can assign to second squad
```

---

## 🎮 **Use Cases**

### **Division Squad** (Team Competition)
**Scenario**: High school trap team competing for division championship

1. Create squad for team
2. Enable "Team Only"
3. Add all shooters from same team
4. All same division (e.g., "Senior")
5. Squad classified as 🏆 Division
6. Scores will count toward division standings

### **Open Squad** (Mixed Competition)
**Scenario**: Open tournament with shooters from multiple teams

1. Create squad
2. Leave "Team Only" disabled
3. Add shooters from different teams
4. Squad classified as 🌐 Open
5. Scores count toward open standings

### **Team-Only Practice Squad**
**Scenario**: Coach wants to keep team together for practice

1. Create squad
2. Enable "Team Only"
3. Squad locked to first team added
4. Cannot accidentally mix teams
5. Easy team management

---

## 🛡️ **Validation Rules**

### **Team-Only Enforcement**
```
✅ Squad is NOT team-only → Any shooter allowed
✅ Squad IS team-only + empty → First shooter sets the team
✅ Squad IS team-only + has members + new shooter same team → Allowed
❌ Squad IS team-only + has members + new shooter different team → BLOCKED
❌ Squad IS team-only + has members + new shooter no team → BLOCKED
```

### **Time Overlap Blocking**
```
Same Date?  ✓
Times overlap? (Start < ExistingEnd AND End > ExistingStart)
  ✓ → BLOCK assignment
  ✗ → Allow assignment

Examples:
  08:00-10:00 + 09:00-11:00 → ❌ BLOCKED
  08:00-10:00 + 10:00-12:00 → ✅ ALLOWED (exact boundary)
  08:00-10:00 + 11:00-13:00 → ✅ ALLOWED (no overlap)
  Sat 08:00-10:00 + Sun 09:00-11:00 → ✅ ALLOWED (different days)
```

---

## 📊 **Benefits**

### **For Coaches**
- 🎯 Easy team management with team-only toggle
- 🏆 Automatic division squad detection
- 🔒 Prevent accidental team mixing
- ⚡ Quick visual identification of squad types

### **For Scoring**
- 📈 Clear division vs open squad distinction
- 🏅 Proper competitive classification
- 📊 Accurate team standings
- 🎖️ Fair division scoring

### **For Safety**
- ❌ Hard block on time conflicts (no override)
- 🛡️ Prevents double-booking
- ✅ Must resolve conflicts before proceeding
- 🔍 Clear error messages

---

## 🧪 **Testing Checklist**

### **Team-Only Toggle**
- [ ] Toggle appears in squad header
- [ ] Can enable/disable team-only
- [ ] State persists after refresh
- [ ] Blue badge shows when enabled
- [ ] API endpoint updates correctly

### **Team-Only Enforcement**
- [ ] Empty squad accepts first shooter (any team)
- [ ] Squad with RMCB member blocks Hawks shooter
- [ ] Squad with RMCB member blocks no-team shooter
- [ ] Squad with RMCB member accepts another RMCB shooter
- [ ] Error message displays team name
- [ ] Works with drag-and-drop
- [ ] Works with empty time slot drop

### **Squad Classification**
- [ ] Empty squad shows "🌐 Open"
- [ ] All same team + division shows "🏆 Division"
- [ ] Division badge shows team name + division
- [ ] Mixed teams shows "🌐 Open"
- [ ] Mixed divisions shows "🌐 Open"
- [ ] Updates automatically when members added/removed
- [ ] Correct badge colors

### **Time Overlap Blocking**
- [ ] Overlapping times show error dialog
- [ ] Error lists conflicting squads
- [ ] Cannot proceed (no Continue button)
- [ ] Non-overlapping times allowed
- [ ] Different days allowed
- [ ] Works for both existing squads and new squad creation

---

## 📝 **API Endpoints**

### **Updated Endpoints**

**PUT `/api/squads/[id]`**
```typescript
// Request body
{
  teamOnly?: boolean  // NEW: Toggle team-only mode
  name?: string
  capacity?: number
  notes?: string
}

// Response: Updated squad with members
```

**POST `/api/squads/[id]/members`**
```typescript
// Enhanced validation
- Checks squad capacity
- Checks team-only requirements
- Enforces team matching
- Returns detailed error messages

// Possible errors
- "Squad is at full capacity"
- "Shooter is already in this squad"
- "This is a team-only squad for [TeamName]"
- "This shooter must be on a team to join"
```

---

## 🎉 **Summary**

All requested features successfully implemented:

1. ✅ **Team-Only Toggle** - Per-squad control for team restriction
2. ✅ **Squad Classification** - Automatic division vs open detection
3. ✅ **Time Overlap Blocking** - Hard block instead of warning
4. ✅ **Enforcement Logic** - Team-only rules enforced at API level
5. ✅ **Visual Indicators** - Badges for classification and team-only status
6. ✅ **Scoring Preparation** - Clear division/open distinction for future scoring

### **Key Achievements**
- Clean, intuitive UI with badges and toggles
- Robust enforcement at API level
- Automatic classification based on members
- Prepares system for competitive scoring
- Better team management for coaches
- Prevents scheduling conflicts

**The squad management system is now ready for competitive scoring with proper division and open squad classification!** 🏆

---

**Try it now!**
1. Go to tournament → "Manage Squads"
2. Create a squad
3. Toggle "Team Only"
4. Add shooters from the same team
5. See the 🏆 Division badge!
6. Try adding from different team → See error!

