# Troubleshooting Guide

## Coach Registration Panel Not Showing

If you've updated your account to coach role but don't see the coach registration interface:

### Solution: Refresh Your Session

1. **Logout** - Click the "Logout" button in the navigation
2. **Login** again with your email and password
3. Check for the **"Coach" badge** next to your name in the navigation
4. Navigate to a tournament

### Checklist

For the coach panel to appear, ALL of these must be true:

- [ ] You're logged in
- [ ] Your account role is "coach" or "admin" 
- [ ] You've logged out and back in after role change
- [ ] You see a "Coach" badge next to your name in the navbar
- [ ] The tournament status is "Upcoming" (not "Active" or "Completed")

### Quick Verification

After logging back in, you should see:
```
Welcome, George Wallace [Coach]
```

If you see this badge, you're good to go!

### Still Not Working?

1. **Check the tournament status**: Only "Upcoming" tournaments show the coach panel
2. **Try a different browser**: Clear cache or use incognito mode
3. **Verify role in database**:
   ```bash
   DATABASE_URL="file:./dev.db" npx prisma studio
   ```
   Navigate to User table and check your role field

4. **Check browser console**: Open DevTools (F12) and look for errors

### Create a Test Tournament

If you want to test with a fresh tournament:

1. Click "Create Tournament"
2. Set **Status** to "Upcoming"
3. Fill in other details
4. Save and view the tournament
5. You should see the coach panel at the top!

