# 🎯 Tournament Editing Feature

## Overview

Admins and tournament creators can now edit tournaments after they've been created, including modifying which disciplines are offered.

---

## 🔑 Who Can Edit Tournaments

**Two types of users can edit tournaments:**

1. **Admins** - Can edit any tournament
2. **Tournament Creators** - Can only edit tournaments they created

---

## ✏️ What Can Be Edited

### All Tournament Details:
- ✅ **Tournament Name**
- ✅ **Location**
- ✅ **Date and Time**
- ✅ **Description**
- ✅ **Status** (upcoming/active/completed)
- ✅ **Disciplines** - Add or remove disciplines

---

## 🎯 How to Edit a Tournament

### Step 1: Navigate to Tournament
Go to the tournament detail page you want to edit.

### Step 2: Click "Edit Tournament"
If you're an admin or the tournament creator, you'll see an **"Edit Tournament"** button in the top-right corner of the tournament header.

### Step 3: Make Your Changes
- Update any fields you want to change
- Check/uncheck disciplines to add or remove them
- **Note:** At least one discipline must be selected

### Step 4: Save
Click **"Save Changes"** to update the tournament.

---

## 📋 Important Notes

### Discipline Changes
When you add or remove disciplines from a tournament:

✅ **Safe to Add:** Adding new disciplines is always safe
- Existing registrations are not affected
- Shooters can register for the new disciplines

⚠️ **Be Careful Removing:** Removing disciplines can affect:
- **Existing registrations** - Shooters may have registered for that discipline
- **Existing scores** - Shoots/scores may exist for that discipline
- Consider the impact before removing disciplines from active tournaments

### Best Practices

**For Upcoming Tournaments:**
- ✅ Safe to add/remove disciplines
- ✅ Update details as needed
- ✅ Notify registered shooters of major changes

**For Active Tournaments:**
- ⚠️ Be cautious with discipline changes
- ⚠️ Don't remove disciplines that have scores
- ✅ Status changes are fine (active → completed)

**For Completed Tournaments:**
- ⚠️ Avoid major changes
- ⚠️ Don't remove disciplines with recorded scores
- ✅ Fix typos or minor details

---

## 🔒 Permissions

### Admin Access
```
✅ Can edit ANY tournament
✅ Can change any field
✅ Can add/remove disciplines
✅ Full control
```

### Creator Access
```
✅ Can edit ONLY their own tournaments
✅ Can change any field
✅ Can add/remove disciplines
❌ Cannot edit other users' tournaments
```

### Regular Users
```
❌ Cannot edit tournaments
❌ No "Edit" button visible
```

---

## 🎨 UI Features

**Edit Button:**
- Gray background for subtle appearance
- Positioned next to "Register" button
- Only visible to authorized users
- Clearly labeled "Edit Tournament"

**Edit Form:**
- Pre-populated with current values
- Discipline checkboxes show current selections
- Same validation as tournament creation
- "Save Changes" and "Cancel" buttons

---

## 💡 Use Cases

### Adding a New Discipline
```
Scenario: Tournament initially offered only Sporting Clays,
          now you want to add 5-Stand

Steps:
1. Click "Edit Tournament"
2. Check the "5-Stand" checkbox
3. Click "Save Changes"
4. Shooters can now register for 5-Stand
```

### Changing Tournament Date
```
Scenario: Weather postponed the tournament

Steps:
1. Click "Edit Tournament"
2. Update the Date field
3. Click "Save Changes"
4. Date is updated on all views
```

### Updating Status
```
Scenario: Tournament day arrived

Steps:
1. Click "Edit Tournament"
2. Change Status from "Upcoming" to "Active"
3. Click "Save Changes"
4. Status badge updates across the app
```

---

## 🔧 Technical Details

### API Endpoint
```javascript
PUT /api/tournaments/[id]

Body:
{
  name: string,
  location: string,
  date: string (ISO format),
  description: string,
  status: "upcoming" | "active" | "completed",
  disciplineIds: string[]
}

Authorization: Required (admin or creator)
```

### Database Changes
When updating disciplines:
1. Deletes existing `TournamentDiscipline` records
2. Creates new `TournamentDiscipline` records
3. Preserves all registrations and scores
4. Uses transaction for data integrity

### Validation
- ✅ All required fields must be provided
- ✅ At least one discipline must be selected
- ✅ User must be admin or creator
- ✅ Tournament must exist

---

## 🚨 Troubleshooting

### "Edit Tournament" Button Not Showing

**Possible Reasons:**
1. You're not logged in → Log in
2. You're not an admin or creator → Contact admin
3. Browser cache issue → Refresh page

### Can't Save Changes

**Possible Issues:**
1. No disciplines selected → Select at least one
2. Missing required fields → Fill all required fields
3. Invalid date format → Use date picker
4. Lost session → Log in again

### Changes Not Appearing

**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Check if save succeeded (look for errors)

---

## 📚 Related Documentation

- [DISCIPLINES_GUIDE.md](DISCIPLINES_GUIDE.md) - Complete disciplines documentation
- [FEATURES.md](FEATURES.md) - All app features
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide

---

## ✨ Example Workflow

### Complete Edit Example

**Initial State:**
- Tournament: "Spring Championship 2025"
- Location: "Springfield Gun Club"
- Date: April 15, 2025
- Disciplines: Sporting Clays only
- Status: Upcoming

**Edit Actions:**
1. Navigate to tournament page
2. Click "Edit Tournament" (admin/creator only)
3. Add disciplines: Check "5-Stand" and "Trap"
4. Update location: "Springfield Gun Club - Field A"
5. Update description: "Now featuring 3 disciplines!"
6. Click "Save Changes"

**Result:**
- Tournament now offers 3 disciplines
- Location updated
- Description updated
- All existing registrations preserved
- New shooters can register for all 3 disciplines

---

## 🎯 Summary

**Key Points:**
- ✅ Admins can edit any tournament
- ✅ Creators can edit their own tournaments
- ✅ All tournament fields can be updated
- ✅ Disciplines can be added or removed
- ⚠️ Be careful removing disciplines with existing data
- ✅ Changes take effect immediately
- ✅ Existing registrations are preserved

**This feature gives admins and organizers the flexibility to adapt tournaments as plans change!**

