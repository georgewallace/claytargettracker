# Testing Guide - Coach Registration Feature

This guide will walk you through testing the new coach registration feature.

## Prerequisites

Make sure the application is running:
```bash
npm run dev
```

Navigate to http://localhost:3000

## Test Scenario 1: Create Coach Account

### Steps:
1. Click "Sign Up" in the navigation
2. Fill in the form:
   - **Name**: Coach Smith
   - **Email**: coach@example.com
   - **Password**: password123
   - **I am a**: Select "Coach"
3. Note the description: "Coaches can register multiple shooters for tournaments"
4. Click "Sign Up"

### Expected Results:
- ✅ Account is created successfully
- ✅ You're redirected to the home page
- ✅ You see "Welcome, Coach Smith" with a "Coach" badge in the navigation
- ✅ No shooter profile was created (coaches don't compete)

## Test Scenario 2: Create Shooter Accounts

### Steps:
1. Logout (click "Logout")
2. Create first shooter:
   - Click "Sign Up"
   - **Name**: Shooter One
   - **Email**: shooter1@example.com
   - **Password**: password123
   - **I am a**: Shooter
   - Click "Sign Up"
3. Logout and repeat for multiple shooters:
   - Shooter Two (shooter2@example.com)
   - Shooter Three (shooter3@example.com)
   - Shooter Four (shooter4@example.com)

### Expected Results:
- ✅ All shooters created successfully
- ✅ Each sees "Welcome, [Name]" without a badge
- ✅ Each has a shooter profile automatically

## Test Scenario 3: Create a Tournament

### Steps:
1. Login as any user (shooter or coach)
2. Click "Create Tournament"
3. Fill in the form:
   - **Tournament Name**: Spring Championship 2025
   - **Location**: Local Shooting Range
   - **Date**: Pick a future date
   - **Status**: Upcoming
   - **Description**: Test tournament for registration
4. Click "Create Tournament"

### Expected Results:
- ✅ Tournament is created
- ✅ You're redirected to tournament detail page
- ✅ Tournament shows correct information

## Test Scenario 4: Coach Bulk Registration

### Steps:
1. Logout and login as the coach (coach@example.com)
2. Navigate to the tournament you created
3. You should see a "Coach Registration" panel at the top

### Test 4a: View All Shooters
- ✅ See list of all shooters with checkboxes
- ✅ See shooter names, emails, and team info
- ✅ See selection count (0 selected initially)

### Test 4b: Search Functionality
1. Type "One" in the search box
2. ✅ List filters to show only "Shooter One"
3. Clear the search
4. ✅ All shooters appear again

### Test 4c: Select Individual Shooters
1. Check the box next to "Shooter One"
2. Check the box next to "Shooter Two"
3. ✅ Selection count shows "2 shooter(s) selected"
4. ✅ Button shows "Register 2 Shooters"

### Test 4d: Submit Registration
1. Click "Register 2 Shooters"
2. ✅ Success message appears
3. ✅ Registered shooters disappear from the list
4. ✅ Scroll down to see them in "Registered Shooters" section

### Test 4e: Select All
1. Click "Select All"
2. ✅ All remaining shooters are checked
3. ✅ Counter updates correctly
4. Click "Clear"
5. ✅ All checkboxes are unchecked

### Test 4f: Register Remaining Shooters
1. Click "Select All"
2. Click the register button
3. ✅ All shooters registered successfully
4. ✅ Coach registration panel shows: "All shooters are already registered"

## Test Scenario 5: Shooter Self-Registration

### Steps:
1. Logout
2. Login as Shooter One (shooter1@example.com)
3. Create a new tournament (as shooter)
4. View the new tournament detail page

### Expected Results:
- ✅ See "Register for Tournament" button (not coach panel)
- ✅ Click button and get registered immediately
- ✅ Button disappears after registration
- ✅ Your name appears in registered shooters list

## Test Scenario 6: Duplicate Prevention

### Steps:
1. Login as coach
2. Navigate to a tournament
3. Try to register a shooter who is already registered

### Expected Results:
- ✅ Already registered shooters don't appear in the list
- ✅ Cannot submit duplicate registrations
- ✅ Success message indicates: "X already registered"

## Test Scenario 7: Role Badges

### Steps:
1. Login as different users

### Expected Results:
- ✅ Coach sees "Coach" badge next to name in navbar
- ✅ Shooter sees no badge
- ✅ Badges are indigo color and rounded

## Test Scenario 8: Permission Testing

### Steps:
1. Login as a shooter (not coach)
2. Try to access `/api/registrations/bulk` directly (using browser dev tools)

### Expected Results:
- ✅ API returns 403 Forbidden
- ✅ Error message: "Only coaches and admins can perform bulk registration"
- ✅ Coach panel doesn't appear on tournament pages for shooters

## Test Scenario 9: Team-Based Registration

### Steps:
1. Login as Shooter One
2. Go to "Teams" page
3. Create a team "Team Alpha"
4. Join the team
5. Repeat for other shooters with different teams
6. Login as coach
7. Navigate to a tournament with coach registration

### Expected Results:
- ✅ Shooters show their team names in the list
- ✅ Can search by team name
- ✅ Team info displays correctly
- ✅ Independent shooters show "Independent" or no team

## Test Scenario 10: Mobile Responsiveness

### Steps:
1. Open browser dev tools
2. Switch to mobile view (375px width)
3. Navigate through coach registration

### Expected Results:
- ✅ Coach registration panel is scrollable
- ✅ Search bar and buttons stack on mobile
- ✅ Shooter list is readable
- ✅ All functionality works on mobile

## Regression Testing

### Verify Existing Features Still Work:

1. **Self-registration for shooters** ✅
2. **Score entry** ✅
3. **Leaderboards** ✅
4. **Team management** ✅
5. **Tournament creation** ✅
6. **Login/logout** ✅

## Edge Cases to Test

### Empty States:
- ✅ No shooters exist in system
- ✅ All shooters already registered
- ✅ Search returns no results

### Boundary Conditions:
- ✅ Register 1 shooter
- ✅ Register many shooters (50+)
- ✅ Very long names or emails

### Error Scenarios:
- ✅ Network error during registration
- ✅ Session timeout
- ✅ Tournament status changes during registration

## Performance Testing

### Load Testing:
1. Create 100+ shooter accounts
2. Try coach registration with large list
3. ✅ Page loads in reasonable time
4. ✅ Search is responsive
5. ✅ Selection is smooth

## Cleanup

After testing, you can reset the database:
```bash
npm run db:reset
```

This will clear all test data and start fresh.

## Known Limitations

1. Coaches cannot register themselves (by design)
2. Only upcoming tournaments allow registration
3. Once registered, shooters cannot be unregistered by coaches (future feature)
4. No email notifications (future feature)

## Success Criteria

All tests should pass with ✅ before considering the feature complete:
- [ ] All test scenarios completed
- [ ] No console errors
- [ ] UI is responsive and polished
- [ ] API security working correctly
- [ ] Documentation is complete
- [ ] Edge cases handled gracefully

## Reporting Issues

If you find any issues during testing:
1. Note the exact steps to reproduce
2. Include error messages or screenshots
3. Check browser console for errors
4. Document expected vs actual behavior

