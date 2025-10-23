# 🎯 Squad Management Implementation Guide

## Status: Foundation Complete ✅

### ✅ What's Done
1. **Database Schema**: Added `SquadMember` model to track shooter assignments
2. **Migration**: Applied successfully (`20251022203957_add_squad_members`)
3. **API Foundation**: Created `/api/timeslots/[id]/squads` endpoint

---

## 🚀 Next Steps to Complete

This is a comprehensive drag-and-drop squad management system. Here's what needs to be built:

### 1. Complete API Routes

#### Create: `app/api/squads/[id]/members/route.ts`
```typescript
// POST: Add shooter to squad
// DELETE: Remove shooter from squad
// PUT: Reorder members
```

#### Create: `app/api/squads/[id]/route.ts`
```typescript
// PUT: Update squad details
// DELETE: Delete squad
```

#### Create: `app/api/tournaments/[id]/auto-squad/route.ts`
```typescript
// POST: Auto-assign shooters to squads based on divisions
```

---

### 2. Auto-Squad Algorithm

**File**: `lib/squadUtils.ts`

```typescript
interface ShooterForSquadding {
  id: string
  name: string
  division: string | null
  grade: string | null
  team: { name: string } | null
}

interface TimeSlotWithSquads {
  id: string
  squadCapacity: number
  squads: Squad[]
}

export function autoAssignShooters(
  shooters: ShooterForSquadding[],
  timeSlots: TimeSlotWithSquads[]
): {
  assignments: Map<string, string[]> // squadId -> shooterIds[]
  suggestions: string[] // Messages about grouping decisions
} {
  // 1. Group shooters by division
  const byDivision = groupBy(shooters, 'division')
  
  // 2. For each division, create squads
  // 3. Try to keep same team together
  // 4. Fill squads to capacity
  // 5. Return assignments
}
```

---

### 3. Drag & Drop Squad Management Page

**File**: `app/tournaments/[id]/squads/page.tsx`

**Features**:
- View all time slots with their squads
- Drag shooters from "unassigned" pool
- Drop onto squad cards
- Visual feedback for divisions (color coding)
- Show squad capacity (e.g., "3/5")
- Auto-squad button

**Libraries to Use**:
- `@dnd-kit/core` for drag and drop
- `@dnd-kit/sortable` for reordering

**Install**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### 4. UI Components Structure

```
app/tournaments/[id]/squads/
├── page.tsx (Server Component - fetches data)
├── SquadManager.tsx (Client Component - main UI)
├── UnassignedShooters.tsx (Draggable shooter pool)
├── TimeSlotSection.tsx (Groups squads by time slot)
├── SquadCard.tsx (Droppable squad container)
├── ShooterCard.tsx (Draggable shooter)
└── AutoSquadModal.tsx (Auto-assignment interface)
```

---

### 5. Example Implementation

#### SquadManager.tsx (Simplified)

```typescript
'use client'

import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useState } from 'react'

export default function SquadManager({ tournament, registeredShooters }) {
  const [squads, setSquads] = useState(tournament.squads)
  const [unassigned, setUnassigned] = useState(registeredShooters)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    // active.id = shooter ID
    // over.id = squad ID
    
    // Call API to assign shooter to squad
    await fetch(`/api/squads/${over.id}/members`, {
      method: 'POST',
      body: JSON.stringify({ shooterId: active.id })
    })
    
    // Update local state
    // ...
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-6">
        {/* Left: Unassigned Shooters */}
        <div className="col-span-1">
          <UnassignedShooters shooters={unassigned} />
        </div>
        
        {/* Right: Time Slots & Squads */}
        <div className="col-span-3">
          {timeSlots.map(slot => (
            <TimeSlotSection key={slot.id} timeSlot={slot} />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
```

---

### 6. Division Color Coding

```typescript
const divisionColors = {
  'Novice': 'bg-green-100 text-green-800 border-green-300',
  'Intermediate': 'bg-blue-100 text-blue-800 border-blue-300',
  'Junior Varsity': 'bg-purple-100 text-purple-800 border-purple-300',
  'Senior': 'bg-orange-100 text-orange-800 border-orange-300',
  'College-Trade School': 'bg-red-100 text-red-800 border-red-300',
}
```

---

### 7. UI/UX Features

#### Visual Feedback
- ✅ Shooter cards show division badge
- ✅ Squad cards show capacity (3/5)
- ✅ Highlight drop zones on drag
- ✅ Animate on successful drop
- ✅ Show "full" state when squad at capacity

#### Smart Features
- ✅ Auto-squad button with division grouping
- ✅ Undo/redo support
- ✅ Bulk assign from team
- ✅ Export squad lists
- ✅ Print-friendly view

---

### 8. Auto-Squad Logic Example

```typescript
// Group shooters by division, keeping teams together
function autoSquad(shooters, timeSlots) {
  const divisions = ['Novice', 'Intermediate', 'Junior Varsity', 'Senior', 'College-Trade School']
  const assignments = []
  
  for (const division of divisions) {
    const divisionShooters = shooters.filter(s => s.division === division)
    
    // Group by team
    const byTeam = groupBy(divisionShooters, 'team.name')
    
    // Create squads
    for (const [teamName, teamShooters] of Object.entries(byTeam)) {
      // Try to keep team together
      const squadSize = timeSlots[0].squadCapacity
      const squads = chunk(teamShooters, squadSize)
      
      squads.forEach((squad, index) => {
        assignments.push({
          name: `${division} - ${teamName} ${index + 1}`,
          shooters: squad,
          timeSlotId: timeSlots[0].id
        })
      })
    }
  }
  
  return assignments
}
```

---

### 9. API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/timeslots/[id]/squads` | List squads for time slot |
| POST | `/api/timeslots/[id]/squads` | Create new squad |
| PUT | `/api/squads/[id]` | Update squad |
| DELETE | `/api/squads/[id]` | Delete squad |
| POST | `/api/squads/[id]/members` | Add shooter to squad |
| DELETE | `/api/squads/[id]/members` | Remove shooter from squad |
| POST | `/api/tournaments/[id]/auto-squad` | Auto-assign shooters |

---

### 10. Testing Checklist

- [ ] Create squads manually
- [ ] Drag shooter to squad
- [ ] Squad shows correct count (3/5)
- [ ] Can't exceed capacity
- [ ] Auto-squad groups by division
- [ ] Divisions are color-coded
- [ ] Remove shooter from squad
- [ ] Delete empty squad
- [ ] Print squad lists

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  Tournament: Spring Championship                   [Auto-Squad] │
├─────────────────┬───────────────────────────────────────────────┤
│ UNASSIGNED (12) │  08:00 - 10:00 • Trap • Field 1              │
│                 │  ┌──────────────────────────────────────────┐ │
│ Novice (4)      │  │ Squad A (3/5)                            │ │
│ ┌─────────────┐ │  │ • John Doe (Novice)                      │ │
│ │ John Doe    │ │  │ • Jane Smith (Novice)                    │ │
│ │ Novice      │ │  │ • Bob Wilson (Novice)                    │ │
│ │ Team RMCB   │ │  │ [Drop here]                              │ │
│ └─────────────┘ │  └──────────────────────────────────────────┘ │
│                 │                                                 │
│ ┌─────────────┐ │  ┌──────────────────────────────────────────┐ │
│ │ Jane Smith  │ │  │ Squad B (2/5)                            │ │
│ │ Novice      │ │  │ • Mike Brown (Intermediate)              │ │
│ │ Team RMCB   │ │  │ • Sarah Davis (Intermediate)             │ │
│ └─────────────┘ │  │ [Drop here]                              │ │
│                 │  └──────────────────────────────────────────┘ │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 🚀 Implementation Order

1. ✅ **Database Schema** (Done)
2. ✅ **Basic API Routes** (Done)
3. **Complete API Routes** (squad members, auto-assign)
4. **Squad Utils Library** (auto-squad logic)
5. **Basic Squad Manager Page** (no drag-drop yet)
6. **Add Drag & Drop** (using @dnd-kit)
7. **Auto-Squad Feature**
8. **Polish & Testing**

---

## 📦 Dependencies Needed

```json
{
  "@dnd-kit/core": "^6.0.8",
  "@dnd-kit/sortable": "^7.0.2",
  "@dnd-kit/utilities": "^3.2.1"
}
```

---

## 💡 Key Design Decisions

1. **Divisions are Primary**: Group shooters by division first
2. **Teams are Secondary**: Try to keep teams together within divisions
3. **Coach Control**: Coaches can override auto-assignments
4. **Flexible**: Support both drag-drop and click-to-assign
5. **Visual Feedback**: Clear indication of capacity and divisions

---

## 🎯 Current Status

✅ Database ready
✅ Basic API endpoint created
⏳ Full implementation in progress

**Estimated Time to Complete**: 4-6 hours for full drag-and-drop system

This is an exciting feature that will make squad management very intuitive! 🚀

