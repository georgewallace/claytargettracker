# AWS Amplify Deployment Troubleshooting

## Issues Fixed

### ✅ Issue 1: Prisma Config Error
**Error**: `Cannot find module 'prisma/config'`

**Solution**: Deleted `prisma.config.ts` file (it's optional and causes issues in Amplify)

---

### ✅ Issue 2: Tailwind CSS PostCSS Error
**Error**: `Cannot find module '@tailwindcss/postcss'`

**Solution**: Moved the following packages from `devDependencies` to `dependencies`:
- `@tailwindcss/postcss`
- `tailwindcss`
- `prisma`

**Why**: Amplify's production build needs these packages available during the build phase.

---

## Current Configuration

### package.json Changes
```json
"dependencies": {
  "@tailwindcss/postcss": "^4",
  "tailwindcss": "^4",
  "prisma": "^6.18.0",
  // ... other dependencies
}
```

### amplify.yml Configuration
- ✅ Node.js 20 explicitly set
- ✅ Prisma generation included
- ✅ Migration handling with fallback
- ✅ Build caching configured

---

## How to Deploy

### Step 1: Commit and Push
```bash
git add .
git commit -m "Fix Amplify deployment issues - Tailwind CSS and Prisma"
git push origin main
```

### Step 2: Watch Build in Amplify Console
1. Go to AWS Amplify Console
2. Your app should auto-deploy
3. Watch the build logs
4. Build should succeed in ~3-5 minutes

---

## Expected Build Output

You should see:
```
✓ Installing Node.js 20
✓ Running npm ci
✓ Generating Prisma Client
✓ Building Next.js app
✓ Deployment successful
```

---

## If You Still Get Errors

### Error: Database Connection Failed
**Solution**: Set environment variable in Amplify Console:
```
DATABASE_URL=file:./dev.db
```

### Error: Build Timeout
**Solution**: Increase build timeout in Amplify settings to 15 minutes

### Error: Memory Issues
**Solution**: Upgrade build instance size in Amplify settings

---

## After Successful Deployment

### 1. Get Your URL
Your app will be available at:
```
https://[branch-name].[app-id].amplifyapp.com
```

### 2. Test the App
- ✅ Home page loads
- ✅ Can create account
- ✅ Can create tournament (as coach/admin)
- ✅ Can register for tournament

### 3. Set Up Custom Domain (Optional)
1. Go to Amplify Console → Domain management
2. Add your domain
3. Amplify handles SSL automatically

---

## Database Options

### Option 1: SQLite (Current Setup)
- ✅ Free
- ✅ Works immediately
- ⚠️ Data resets on each deployment
- **Good for**: Testing, development

### Option 2: PostgreSQL RDS (Recommended for Production)
1. Create RDS instance (see AWS_DEPLOYMENT.md)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set environment variable in Amplify:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```
4. Push changes
   ```bash
   git add prisma/schema.prisma
   git commit -m "Switch to PostgreSQL"
   git push origin main
   ```

---

## Cost Monitoring

### Current Setup Cost
- **Amplify Hosting**: $0-2/month (free tier)
- **SQLite**: $0
- **Total**: ~$0-2/month

### With PostgreSQL RDS
- **Amplify**: $0-2/month
- **RDS Free Tier**: $0 (first 12 months)
- **After 12 months**: ~$15/month
- **Total**: $0-17/month

---

## Useful Commands

### View Build Logs
```bash
# In Amplify Console
# Click on your app → Build history → View logs
```

### Manual Rebuild
```bash
# In Amplify Console
# Click "Redeploy this version"
```

### Check Environment Variables
```bash
# In Amplify Console
# App settings → Environment variables
```

---

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Create your first tournament
3. ✅ Invite team members
4. ✅ Consider upgrading to PostgreSQL for persistence
5. ✅ Set up custom domain
6. ✅ Enable monitoring in CloudWatch

---

## Need Help?

**Common Issues**:
- Build fails → Check build logs in Amplify Console
- App loads but database errors → Check DATABASE_URL environment variable
- Slow performance → Consider upgrading RDS instance

**Resources**:
- AWS Amplify Docs: https://docs.amplify.aws/
- Next.js on Amplify: https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/
- Prisma Docs: https://www.prisma.io/docs

---

## Success Checklist

- [ ] Committed all changes
- [ ] Pushed to GitHub
- [ ] Amplify auto-deployed
- [ ] Build succeeded
- [ ] App is accessible at Amplify URL
- [ ] Can create account
- [ ] Can login
- [ ] Database is working
- [ ] No console errors

**If all checked**: 🎉 Your app is live!

