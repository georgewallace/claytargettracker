# 📅 Schedule Management Guide

## Overview

The Schedule Management feature allows tournament admins and creators to set up time slots for different disciplines across multiple tournament days. This makes it easy to organize when and where shooters will compete.

---

## 🎯 Key Features

### 1. Multi-Day Tournament Support
- Tournaments can now span multiple days
- Start date and end date fields when creating/editing tournaments
- Each day can have its own schedule

### 2. Time Slot Management
- **Smart Generation**: Automatically create multiple time slots with one click
- **Manual Creation**: Add individual time slots as needed
- **Easy Deletion**: Remove time slots that aren't needed
- **Field/Station Numbers**: Assign specific fields (Skeet/Trap) or stations (Sporting Clays)

### 3. Discipline-Specific Configuration
- **Skeet & Trap**: Assign field numbers (e.g., "Field 1", "Field 2")
- **Sporting Clays**: Assign station numbers (e.g., "Station 1", "Station 2")
- **5-Stand**: Can use either field or station numbering

### 4. Squad Capacity
- Set how many shooters per squad for each time slot
- Typically 5 shooters, but adjustable from 1-10
- Future feature: Create and manage squads within time slots

---

## 🚀 How to Use

### Accessing Schedule Management

1. **Navigate to a tournament** you created or that you're an admin for
2. **Click "Manage Schedule"** button at the top of the tournament page
3. You'll see the Schedule Management interface

### Understanding the Interface

The Schedule Management page has several sections:

#### **Day Tabs**
- One tab for each day of your tournament
- Shows how many time slots exist for each day
- Click a tab to view/manage that day's schedule

#### **Discipline Filter**
- Filter time slots by discipline
- Useful for multi-discipline tournaments

#### **Time Slots Display**
- Grouped by discipline
- Shows start/end time, capacity, field/station numbers
- Indicates if squads have been created

---

## 📝 Creating Time Slots

### Option 1: Smart Generation (Recommended)

This is the fastest way to create multiple time slots at once.

1. **Click "Generate Time Slots"**
2. **Configure your settings**:
   - **Discipline**: Which event (Sporting Clays, Skeet, etc.)
   - **Date**: Which tournament day
   - **Start Time**: When to begin (e.g., 8:00 AM)
   - **End Time**: When to end (e.g., 5:00 PM)
   - **Slot Duration**: How long each slot (30 min, 1 hr, 2 hrs, 3 hrs)
   - **Squad Capacity**: Shooters per squad (typically 5)
   - **Field/Station Number**: Optional location identifier

3. **Preview**: See exactly what time slots will be created
4. **Click "Generate"**

#### Example:
```
Settings:
- Discipline: Sporting Clays
- Date: March 15, 2025
- Start: 08:00
- End: 17:00
- Duration: 2 hours
- Capacity: 5
- Station: Station 1

Result: Creates 4 time slots:
• 08:00 - 10:00
• 10:00 - 12:00
• 12:00 - 14:00
• 14:00 - 16:00
(Note: 16:00-17:00 slot not created because it's less than 2 hours)
```

### Option 2: Manual Addition

For more control or adding individual slots:

1. **Click "+ Add Time Slot"**
2. **Fill in details**:
   - Date (pre-selected to current day tab)
   - Discipline
   - Start time
   - End time
   - Squad capacity
   - Field/Station number (optional)
   - Notes (optional)
3. **Click "Add Time Slot"**

---

## 🎨 Time Slot Details

### What's Displayed

Each time slot card shows:
- **Time Range**: e.g., "08:00 - 10:00"
- **Field/Station Badge**: Visual indicator of location
- **Capacity**: Shooters per squad
- **Squad Count**: How many squads have been created
- **Notes**: Any additional information
- **Delete Button**: Remove the time slot

### Color Coding

- **Blue Badge**: Field number (Skeet/Trap)
- **Purple Badge**: Station number (Sporting Clays)

---

## 🗑️ Deleting Time Slots

1. **Click "Delete"** on the time slot card
2. **Confirm** the deletion

**Note**: You cannot delete a time slot if it has squads assigned to it. Delete the squads first.

---

## 💡 Best Practices

### Planning Your Schedule

1. **Start Early**: Set up your schedule when you create the tournament
2. **Allow Buffer Time**: Leave gaps between slots for cleanup/transitions
3. **Consistent Timing**: Try to keep slot durations consistent within a discipline
4. **Field/Station Numbers**: Always add these for multi-field events

### Typical Schedules

#### **Single-Day Tournament**
```
Sporting Clays - Station 1
08:00 - 10:00
10:00 - 12:00
13:00 - 15:00 (lunch break before)
15:00 - 17:00

Skeet - Field 1
08:00 - 09:00
09:00 - 10:00
10:00 - 11:00
... etc
```

#### **Multi-Day Tournament**
```
Day 1: Sporting Clays & 5-Stand
Day 2: Skeet & Trap
Day 3: Championship rounds
```

### Time Slot Durations

- **Sporting Clays**: 2-3 hours per slot (100 targets)
- **Skeet**: 30-60 minutes per slot (25 targets)
- **Trap**: 30-60 minutes per slot (25 targets)
- **5-Stand**: 30-60 minutes per slot (25 targets)

---

## 🔒 Permissions

### Who Can Manage Schedule?
- **Tournament Creator**: The person who created the tournament
- **Admins**: Users with admin role

### What They Can Do:
- Create time slots (smart generation or manual)
- Delete time slots (if no squads assigned)
- View all time slots
- Create squads (future feature)

---

## 🚧 Future Enhancements

The following features are planned:

### Squad Management
- Create named squads within time slots (e.g., "Squad A", "Squad B")
- Set capacity per squad
- Assign shooters to specific squads
- View squad rosters

### Shooter Assignment
- Automatically assign registered shooters to squads
- Manual assignment by coach/admin
- Squad rotation scheduling
- Check-in system

### Advanced Features
- Conflict detection (overlapping field/station usage)
- Schedule templates (save and reuse)
- Print schedule view
- Mobile-friendly shooter schedule view
- Real-time availability updates

---

## 📊 Technical Details

### Database Schema

#### TimeSlot Model
```prisma
model TimeSlot {
  id            String   @id @default(cuid())
  tournamentId  String
  disciplineId  String
  date          DateTime
  startTime     String   // "HH:MM" 24-hour format
  endTime       String   // "HH:MM" 24-hour format
  squadCapacity Int      @default(5)
  fieldNumber   String?  // For Skeet/Trap
  stationNumber String?  // For Sporting Clays
  notes         String?
  
  tournament Tournament @relation(...)
  discipline Discipline @relation(...)
  squads     Squad[]
}
```

#### Squad Model (Ready for future use)
```prisma
model Squad {
  id         String   @id @default(cuid())
  timeSlotId String
  name       String   // "Squad A", "Squad 1"
  capacity   Int      @default(5)
  notes      String?
  
  timeSlot TimeSlot @relation(...)
}
```

### API Endpoints

#### List Time Slots
```
GET /api/tournaments/[id]/timeslots
Returns: Array of time slots with disciplines and squads
```

#### Create Time Slot(s)
```
POST /api/tournaments/[id]/timeslots
Body: Single object or array of time slot objects
Returns: Created time slot(s)
```

#### Delete Time Slot
```
DELETE /api/timeslots/[id]
Returns: Success message
Error: 400 if squads exist
```

### Utility Functions

Located in `lib/timeSlotUtils.ts`:
- `generateTimeSlots()`: Smart slot generation
- `getTimeOptions()`: Hour/half-hour options
- `formatTimeRange()`: Display formatting
- `validateTimeSlot()`: Input validation
- `getDateRange()`: Date array for tournament
- `hasTimeOverlap()`: Conflict detection

---

## 🐛 Troubleshooting

### "Cannot delete time slot with existing squads"
**Solution**: Delete all squads in that time slot first, then delete the time slot.

### "Time slot date must be within tournament date range"
**Solution**: Make sure the date you're selecting is between the tournament's start and end dates.

### "Discipline is not part of this tournament"
**Solution**: Only disciplines that were selected when creating/editing the tournament can have time slots.

### Time slots not showing up
**Solution**: 
1. Make sure you're on the correct day tab
2. Check the discipline filter
3. Refresh the page

### "End time must be after start time"
**Solution**: Choose an end time that comes after the start time.

---

## 📖 Examples

### Example 1: Weekend Tournament

**Tournament**: Spring Classic 2025
**Dates**: March 15-16, 2025 (Sat-Sun)
**Disciplines**: Sporting Clays, Skeet

#### Day 1 (Saturday) - Sporting Clays
```
Station 1:
- 08:00 - 10:30 (Squad capacity: 5)
- 10:30 - 13:00
- 13:30 - 16:00 (30 min lunch break)

Station 2:
- 08:00 - 10:30 (Squad capacity: 5)
- 10:30 - 13:00
- 13:30 - 16:00
```

#### Day 2 (Sunday) - Skeet
```
Field 1:
- 08:00 - 09:00 (Squad capacity: 5)
- 09:00 - 10:00
- 10:00 - 11:00
- 11:00 - 12:00

Field 2:
- 08:00 - 09:00 (Squad capacity: 5)
- 09:00 - 10:00
- 10:00 - 11:00
- 11:00 - 12:00
```

### Example 2: Large Multi-Discipline Event

**Tournament**: State Championship
**Dates**: April 5-7, 2025 (Fri-Sun)
**Disciplines**: All (Sporting Clays, 5-Stand, Skeet, Trap)

Use the smart generation feature to quickly create:
- **Day 1 (Friday)**: Sporting Clays (3 stations, 2-hour slots)
- **Day 2 (Saturday)**: 5-Stand & Skeet (2 fields each, 1-hour slots)
- **Day 3 (Sunday)**: Trap (3 fields, 1-hour slots)

---

## ✅ Quick Start Checklist

- [ ] Create or edit tournament with multiple days
- [ ] Select disciplines for the tournament
- [ ] Navigate to "Manage Schedule"
- [ ] For each day and discipline:
  - [ ] Click "Generate Time Slots"
  - [ ] Set start/end times
  - [ ] Choose slot duration
  - [ ] Add field/station numbers
  - [ ] Generate slots
- [ ] Review and adjust as needed
- [ ] (Future) Create squads and assign shooters

---

## 📞 Need Help?

If you encounter issues or have questions:
1. Check the Troubleshooting section above
2. Review the examples
3. Ensure you have admin or creator permissions
4. Try refreshing the page

---

**Last Updated**: October 2025
**Version**: 1.0.0

