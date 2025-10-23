# 🎯 Shooter Profile Management

## Overview

Coaches can now manage detailed profiles for shooters on their team, including:
- Date of Birth (Month/Year)
- NSCA Class
- ATA Class
- Grade in School
- Division (auto-calculated)

---

## 🏫 Division System

Divisions are **automatically calculated** based on the shooter's grade in school:

### Division Categories

| Division | Grade Range |
|----------|-------------|
| **Novice** | 6th grade and below |
| **Intermediate** | 7th – 8th grade |
| **Junior Varsity** | 9th grade |
| **Senior** | 10th – 12th grade |
| **College-Trade School** | Post-high school |

The system automatically assigns the correct division when you select a grade.

---

## 👨‍🏫 For Coaches

### Accessing Shooter Profiles

1. Navigate to **"My Team"** in the navigation bar
2. You'll see all shooters on your team
3. Each shooter card shows:
   - Name and email
   - **Grade and Division** (if entered)
   - "Edit Details" button
   - "Remove" button

### Editing Shooter Details

1. Click **"Edit Details"** next to the shooter's name
2. Fill in the shooter information:
   - **Date of Birth** (Month and Year dropdowns)
   - **Grade in School** (dropdown)
   - **NSCA Class** (text field - e.g., A, B, C, D, E)
   - **ATA Class** (text field - e.g., AA, A, B, C, D)
3. **Division is automatically calculated** as you select the grade
4. Click **"Save Changes"**

### What You'll See

After saving, the shooter's profile will show:
- Their current grade
- Their division (in indigo color)
- Classification info (NSCA/ATA)

---

## 📝 Field Details

### Date of Birth
- **Format:** Month and Year dropdowns
- **Purpose:** Track shooter age for age-based divisions
- **Optional:** Not required

### Grade in School
- **Options:** K through 12, plus College-Trade School
- **Purpose:** Determines division placement
- **Auto-calculates:** Division updates immediately

### NSCA Class
- **National Sporting Clays Association** classification
- **Common Values:** A, B, C, D, E (plus master/AA)
- **Purpose:** Track skill level for sporting clays
- **Optional:** Not required

### ATA Class
- **Amateur Trapshooting Association** classification
- **Common Values:** AA, A, B, C, D
- **Purpose:** Track skill level for trap shooting
- **Optional:** Not required

### Division
- **Auto-calculated** from grade
- **Not editable** - system determines this
- **Displayed prominently** on team roster
- **Used for:** Tournament organization, fair competition

---

## 🎯 Use Cases

### Example 1: New Shooter Setup
```
Coach adds a new 8th grader to the team:
1. Add shooter to team (existing process)
2. Click "Edit Details"
3. Select Birth Month: January
4. Select Birth Year: 2010
5. Select Grade: 8th Grade
6. System shows: Division = "Intermediate"
7. Enter NSCA Class: C
8. Enter ATA Class: B
9. Save Changes

Result: Shooter shows "Grade: 8 • Intermediate"
```

### Example 2: Updating for New School Year
```
Shooter moves from 9th to 10th grade:
1. Click "Edit Details"
2. Update Grade: 10th Grade
3. System automatically changes Division from "Junior Varsity" to "Senior"
4. Save Changes

Result: Division updated automatically
```

### Example 3: College Shooter
```
High school graduate joining college team:
1. Click "Edit Details"
2. Select Grade: College-Trade School
3. System shows: Division = "College-Trade School"
4. Update classifications as needed
5. Save Changes
```

---

## 🔒 Permissions

### Who Can Edit Shooter Profiles?

**Coaches:**
- ✅ Can edit shooters on their team only
- ✅ Must be assigned as coach to a team
- ❌ Cannot edit shooters on other teams

**Admins:**
- ✅ Can edit any shooter
- ✅ Full access to all profiles

**Shooters:**
- ❌ Cannot edit their own profiles
- ❌ Must request updates through coach

---

## 💡 Tips for Coaches

### Best Practices

1. **Update at Start of Season**
   - Update all grades for new school year
   - Verify divisions are correct
   - Check classifications are current

2. **Keep Classifications Current**
   - Update NSCA/ATA classes as shooters improve
   - Check official classification cards
   - Update after major tournaments

3. **Verify Birth Dates**
   - Confirm month/year with parent/shooter
   - Important for age-based competitions
   - Required for some tournaments

4. **Monitor Grade Changes**
   - Update when shooter advances grades
   - Watch for JV → Senior transitions (significant)
   - Update before tournament registrations

### Common Workflows

**New Season Setup:**
```
For each shooter on team:
1. Update grade for current school year
2. Verify division auto-calculation
3. Update any classification changes
4. Save changes
```

**Pre-Tournament Check:**
```
1. Review all shooter divisions
2. Confirm grades are current
3. Verify classifications if tournament requires them
4. Make any needed updates
```

---

## 📊 Visual Indicators

### On Team Roster
Shooters display their info like this:
```
John Smith
john.smith@example.com
Grade: 10 • Senior

[Edit Details]  [Remove]
```

### On Edit Page
- **Division shown prominently** in indigo box
- **Auto-updates** as you change grade
- **Division categories** explained at bottom
- **Clear labels** for each field

---

## 🔧 Technical Details

### Division Calculation

The system uses this logic:

```javascript
Grade → Division
K-6   → Novice
7-8   → Intermediate
9     → Junior Varsity
10-12 → Senior
College → College-Trade School
```

### Database Fields

Stored in `Shooter` model:
- `birthMonth` (Integer 1-12)
- `birthYear` (Integer)
- `nscaClass` (String, optional)
- `ataClass` (String, optional)
- `grade` (String, optional)
- `division` (String, auto-calculated)

### API Endpoint

```javascript
PUT /api/shooters/[id]

Body:
{
  birthMonth: "1",      // 1-12
  birthYear: "2010",    // Year
  nscaClass: "C",       // Optional
  ataClass: "B",        // Optional
  grade: "8"            // Grade selection
}

Authorization: Coach (for their team) or Admin
```

---

## 🚨 Troubleshooting

### Division Not Updating

**Problem:** Selected a grade but division doesn't show
**Solution:** 
- Make sure grade is actually selected (not just hovered)
- Check that it's a valid grade option
- Try refreshing the page

### Can't Access Edit Page

**Problem:** "Edit Details" button not working
**Solution:**
- Verify you're logged in as a coach
- Confirm shooter is on your team
- Check that you have coach role (not just admin)

### Changes Not Saving

**Problem:** Click save but changes don't stick
**Solution:**
- Check browser console for errors
- Verify all required fields if any
- Try logging out and back in
- Contact admin if persists

---

## 📈 Reporting & Analytics

### Future Enhancements

Potential features for future development:
- [ ] Division-based tournament filtering
- [ ] Class progression tracking over time
- [ ] Age verification for tournaments
- [ ] Export roster with all details
- [ ] Division statistics and distribution
- [ ] Automatic grade advancement by date

---

## 🎓 Division Guidelines

### Important Notes

**Junior Varsity (9th Grade):**
- Typically for 9th graders OR first-time high school shooters
- Coaches may need to manually adjust in special cases
- Consider maturity and experience

**Novice (6th and Below):**
- "Depending on maturity" note applies
- Coaches should evaluate readiness
- May need administrator override for special cases

**College-Trade School:**
- Includes all post-high school education
- Community college, trade school, university all qualify
- Age is not the determining factor

---

## ✅ Checklist for Coaches

### Initial Setup (per shooter)
- [ ] Add shooter to team
- [ ] Edit shooter details
- [ ] Enter birth month/year if known
- [ ] Select current grade
- [ ] Verify auto-calculated division is correct
- [ ] Add NSCA class if applicable
- [ ] Add ATA class if applicable
- [ ] Save changes

### Ongoing Maintenance
- [ ] Update grades at start of school year
- [ ] Update classifications after tournaments
- [ ] Verify divisions are appropriate
- [ ] Keep contact information current

### Pre-Tournament
- [ ] Review all shooter profiles
- [ ] Confirm divisions are accurate
- [ ] Check tournament-specific requirements
- [ ] Update any out-of-date information

---

## 🎯 Summary

**Key Points:**
- ✅ Coaches manage shooter profiles
- ✅ Division auto-calculates from grade
- ✅ Track NSCA and ATA classifications
- ✅ Birth dates for age verification
- ✅ Easy editing from team roster
- ✅ Clear visual indicators
- ✅ Permission-controlled access

**This feature helps coaches maintain accurate, up-to-date information on their team members for better tournament management and fair competition placement!**

