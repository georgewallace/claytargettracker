# 🚨 Fix: Application Error on AWS Amplify

## Error Message
```
Application error: a server-side exception has occurred
Digest: 206356262
```

## ✅ Solution: Set Environment Variables

### Step 1: Go to Amplify Console
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click on your app: `claytargettracker`
3. Go to **"Hosting" → "Environment variables"** (left sidebar)

### Step 2: Add DATABASE_URL
Click **"Manage variables"** and add:

**Variable name**: `DATABASE_URL`  
**Value**: `file:./dev.db`

Click **"Save"**

### Step 3: Redeploy
After saving the environment variable:
1. Go to **"Build history"**
2. Click **"Redeploy this version"** on the latest build
3. Wait 2-3 minutes for redeployment

---

## 🔍 How to View Server Logs (To See Actual Error)

### Option 1: CloudWatch Logs (Detailed)
1. In Amplify Console, go to your app
2. Click **"Monitoring"** in the left sidebar
3. Click **"View logs in CloudWatch"**
4. Look for **"Server-side SSR logs"**
5. Click on the latest log stream
6. Look for error messages with red [ERROR] tags

### Option 2: Amplify Function Logs
1. In Amplify Console
2. Go to **"Hosting" → "Functions"**
3. Click on the function name
4. View recent logs

---

## 🎯 Expected Behavior After Fix

After setting `DATABASE_URL` and redeploying:
- ✅ App loads successfully
- ✅ Can create account
- ✅ Can login
- ✅ Database works

---

## 🔧 If Still Getting Errors

### Check Other Environment Variables

You might also need these (optional, depending on error logs):

```
NODE_ENV=production
NEXTAUTH_URL=https://main.d21er08xkztq9f.amplifyapp.com
NEXTAUTH_SECRET=your-random-secret-key-here
```

To generate a secret:
```bash
openssl rand -base64 32
```

### Common Issues & Solutions

#### Issue: "Cannot find module '@prisma/client'"
**Solution**: Already fixed in our package.json ✅

#### Issue: "prisma generate not run"
**Solution**: Already in amplify.yml ✅

#### Issue: "cookies() expects to have requestAsyncStorage"
**Solution**: This is because we're using `cookies()` in `lib/auth.ts`. We might need to adjust this for Amplify's SSR environment.

---

## 📋 Quick Checklist

- [ ] Set `DATABASE_URL=file:./dev.db` in Amplify environment variables
- [ ] Redeploy the app
- [ ] Check CloudWatch logs for any remaining errors
- [ ] Test: Visit your app URL
- [ ] Test: Try to create an account

---

## 🆘 If You See Specific Errors in CloudWatch

Please share the error message from CloudWatch logs so I can provide a specific fix.

Common errors we might see:
1. **Database connection errors** → DATABASE_URL fix (above)
2. **Prisma errors** → Migration or generation issues
3. **Cookie/session errors** → Need to adjust auth code for Amplify
4. **Module not found** → Missing dependency (rare after our fixes)

---

## 💡 Quick Test

After setting the environment variable and redeploying, your app should:
1. Load the home page ✅
2. Show the tournament list ✅
3. Allow signup/login ✅

If you still get errors, grab the CloudWatch logs and I'll help debug further!

