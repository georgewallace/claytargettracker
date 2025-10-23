# 🎯 Squad Management System - User Guide

## ✅ **System Complete!**

You now have a fully functional drag-and-drop squad management system for organizing shooters into squads across time slots!

---

## 🚀 **How to Access**

1. **Navigate to a tournament** page
2. **Click the green "Manage Squads" button** (visible to coaches and admins)
3. You'll see the Squad Management interface

---

## 🎨 **Interface Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│  Tournament: Spring Championship          [Back to Tournament]  │
├─────────────────┬───────────────────────────────────────────────┤
│                 │  Stats: 20 Total | 12 Unassigned | 4 Squads   │
├─────────────────┼───────────────────────────────────────────────┤
│ UNASSIGNED (12) │  Saturday, December 29, 2025                   │
│                 │                                                 │
│ Novice (4)      │  08:00 - 10:00 • Trap • Field 1                │
│ 🟢 John Doe     │  ┌────────────┐  ┌────────────┐               │
│    Team RMCB    │  │ Squad A    │  │ Squad B    │               │
│                 │  │ (3/5)      │  │ (2/5)      │               │
│ 🟢 Jane Smith   │  │ • John Doe │  │ • Mike B   │               │
│    Team RMCB    │  │ • Jane S   │  │ • Sarah D  │               │
│                 │  │ • Bob W    │  │            │               │
│ Intermediate(3) │  └────────────┘  └────────────┘               │
│ 🔵 Mike Brown   │                                                 │
│    Team Hawks   │  [Squad name] [+ Add Squad]                    │
│                 │                                                 │
│ 💡 Drag         │  09:00 - 11:00 • Trap • Field 2                │
│ shooters to     │  ...                                            │
│ squads          │                                                 │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 🎯 **Key Features**

### **1. Drag & Drop Assignment**
- **Drag** shooters from the left sidebar
- **Drop** them onto squad cards
- Visual feedback shows where you can drop
- Squads show capacity (e.g., "3/5")

### **2. Division-Based Organization**
Shooters are automatically grouped by division in the sidebar:
- 🟢 **Novice** (Green)
- 🔵 **Intermediate** (Blue)
- 🟣 **Junior Varsity** (Purple)
- 🟠 **Senior** (Orange)
- 🔴 **College-Trade School** (Red)

### **3. Squad Management**
- **Create Squads**: Enter name and click "+ Add Squad"
- **Fill Squads**: Drag shooters into squads
- **Remove Shooters**: Click ×

 on a shooter card to remove them
- **Delete Squads**: Click trash icon to delete empty squads

### **4. Capacity Management**
- Each squad shows current fill: **"3/5"**
- **Full squads** show "(Full)" and reject new drops
- Visual indicators prevent overfilling

---

## 📋 **Step-by-Step Workflow**

### **Step 1: Create Time Slots**
First, make sure you have time slots created:
1. Go to tournament → "Manage Schedule"
2. Create time slots for your disciplines
3. Time slots will appear in Squad Management

### **Step 2: Create Squads**
For each time slot:
1. Scroll to the time slot section
2. Enter squad name (e.g., "Squad A", "Novice 1")
3. Click "+ Add Squad"
4. Repeat for multiple squads

### **Step 3: Assign Shooters**
Two methods:

#### **Manual Assignment** (Drag & Drop)
1. Find shooter in left sidebar
2. Click and drag the shooter card
3. Drop onto desired squad
4. Release to assign

#### **Smart Tips**
- Keep same division together (they're already grouped!)
- Keep teammates together (shown in shooter info)
- Fill squads to capacity before creating new ones

### **Step 4: Adjust as Needed**
- Remove shooters: Click × on their card
- Move shooters: Remove, then drag to new squad
- Delete empty squads: Click trash icon

---

## 💡 **Pro Tips**

### **Organizing by Division**
The sidebar already groups shooters by division. Try to:
1. Create division-specific squads (e.g., "Novice 1", "Novice 2")
2. Drag all shooters from a division together
3. This keeps skill levels balanced

### **Keeping Teams Together**
Shooter cards show team names:
1. Look for shooters from the same team
2. Try to squad them together when possible
3. Helps with comfort and camaraderie

### **Multiple Time Slots**
For events with multiple time slots:
1. Distribute shooters across time slots
2. Balance divisions across slots
3. Consider field availability

---

## 🎨 **Visual Guide**

### **Shooter Card** (Draggable)
```
┌─────────────────────┐
│ John Doe            │
│ Team RMCB           │
│ 🟢 Novice           │
└─────────────────────┘
```

### **Squad Card** (Droppable)
```
┌──────────────────────┐
│ Squad A      🗑️      │
│ (3/5)                │
├──────────────────────┤
│ 🟢 John Doe          │×
│ 🟢 Jane Smith        │×
│ 🟢 Bob Wilson        │×
│                      │
│ [Drop here]          │
└──────────────────────┘
```

### **Full Squad** (No More Drops)
```
┌──────────────────────┐
│ Squad B      🗑️      │
│ (5/5) (Full)         │
├──────────────────────┤
│ 🟢 Shooter 1         │×
│ 🟢 Shooter 2         │×
│ 🟢 Shooter 3         │×
│ 🟢 Shooter 4         │×
│ 🟢 Shooter 5         │×
└──────────────────────┘
```

---

## 🔧 **Technical Details**

### **What Happens When You Drag**
1. Shooter card gets highlighted
2. Valid drop zones light up (blue border)
3. Full squads show red indicator
4. On drop: API call assigns shooter
5. Page refreshes to show updated state

### **Database Structure**
- **Squad**: Container with name and capacity
- **SquadMember**: Links shooter to squad
- **TimeSlot**: Has multiple squads
- Each shooter can only be in one squad per tournament

---

## ❓ **Troubleshooting**

### **Can't Drag Shooters**
- Make sure you click and hold on the shooter card
- Drag at least 8px before it activates
- Try refreshing the page

### **Drop Not Working**
- Check if squad is full (shows "Full")
- Make sure you're dropping on the squad card (not between them)
- Squad cards have blue border when ready to receive

### **Shooter Appears in Multiple Places**
- This shouldn't happen - each shooter can only be in one squad
- If it does, try refreshing the page
- Contact admin if issue persists

### **Can't Delete Squad**
- Squads with members require confirmation
- Remove all members first for easier deletion

---

## 📊 **Statistics Dashboard**

At the top of the page, you'll see:
- **Total Shooters**: All registered shooters
- **Unassigned**: Shooters not in any squad
- **Time Slots**: Number of available time slots
- **Total Squads**: Number of squads created

Goal: Get "Unassigned" to 0! 🎯

---

## 🎯 **Best Practices**

### **Before the Tournament**
1. ✅ Create all time slots first
2. ✅ Create squads for each time slot
3. ✅ Assign all shooters to squads
4. ✅ Verify no unassigned shooters remain
5. ✅ Print/export squad lists

### **Squad Naming Conventions**
- **By Letter**: "Squad A", "Squad B", "Squad C"
- **By Number**: "Squad 1", "Squad 2", "Squad 3"
- **By Division**: "Novice 1", "Senior 2", "JV A"
- **By Time**: "Morning Squad", "Afternoon Squad"

### **Balancing Squads**
- Try to keep squads at capacity (5 shooters)
- Mix skill levels if appropriate
- Keep same division together when possible
- Accommodate special requests

---

## 🚀 **What's Next?**

### **Future Enhancements** (Not Yet Implemented)
The system is ready for:
- 📄 **Print Squad Lists**: Export to PDF
- 📊 **Auto-Squad Algorithm**: One-click assignment by division
- 🔄 **Bulk Move**: Move multiple shooters at once
- 📱 **Mobile Optimization**: Better touch support
- 🔔 **Notifications**: Alert shooters of squad assignments

---

## 🎉 **You're All Set!**

The drag-and-drop squad management system is fully functional and ready to use!

### **Quick Start Checklist**
- [x] Database schema updated
- [x] API routes created
- [x] Drag & drop interface built
- [x] Division color coding active
- [x] Capacity management working
- [x] "Manage Squads" button added to tournaments

**Go ahead and start organizing your shooters!** 🎯

---

**Need Help?** Check the implementation guide at `SQUAD_MANAGEMENT_IMPLEMENTATION.md` for technical details.

