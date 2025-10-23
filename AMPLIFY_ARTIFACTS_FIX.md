# 🔧 AWS Amplify Artifacts Configuration Fix

## 🚨 The Problem

Even though we added the Prisma binary targets to `schema.prisma`:
```prisma
binaryTargets = ["native", "rhel-openssl-3.0.x"]
```

The AWS Lambda binary (`libquery_engine-rhel-openssl-3.0.x.so.node`) was **not being included** in the deployment package, causing this runtime error:

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

## 🎯 Root Cause

The `amplify.yml` artifacts configuration was only including the `.next` directory:

```yaml
artifacts:
  baseDirectory: .next
  files:
    - '**/*'
```

This **excluded** the Prisma binaries located in `node_modules/.prisma/client/`.

## ✅ The Solution

Updated `amplify.yml` to explicitly include all necessary files:

```yaml
artifacts:
  baseDirectory: .
  files:
    - '.next/**/*'                          # Next.js build output
    - 'node_modules/.prisma/client/**/*'    # Prisma generated client & binaries
    - 'node_modules/@prisma/client/**/*'    # Prisma client package
    - 'node_modules/**/*'                   # All dependencies
    - 'package.json'                        # Package manifest
    - 'prisma/**/*'                         # Prisma schema files
```

Also added verification step to check binaries are generated:

```yaml
- echo "Checking for Prisma binaries..."
- ls -la node_modules/.prisma/client/*.node || echo "Prisma binaries not found!"
```

## 📊 What This Does

### Before:
1. Build succeeds ✅
2. Only `.next/` directory deployed ❌
3. Prisma binaries not included ❌
4. Runtime error when accessing database ❌

### After:
1. Build succeeds ✅
2. `.next/` + `node_modules` deployed ✅
3. Both Prisma binaries included ✅
4. Database queries work ✅

## 🚀 Deploy Now

### Commands:
```bash
git add amplify.yml
git commit -m "Fix Amplify artifacts to include Prisma binaries"
git push origin main
```

### What to Watch For in Build Logs:

1. **Prisma Generation** (in preBuild phase):
```
✔ Generated Prisma Client (v6.18.0)
```

2. **Binary Verification** (new step):
```
Checking for Prisma binaries...
-rwxr-xr-x ... libquery_engine-rhel-openssl-3.0.x.so.node
```

3. **Artifacts** (should now include node_modules):
```
Uploading artifacts...
Size: ~XXX MB (larger than before because it includes node_modules)
```

## ✅ Expected Result

After this deployment:
- ✅ App loads successfully
- ✅ No Prisma errors in CloudWatch logs
- ✅ Database queries work
- ✅ Tournaments display on home page
- ✅ Can sign up and login
- ✅ Full app functionality works

## 📝 Why This Matters

AWS Amplify's default behavior for Next.js apps assumes all necessary code is in the `.next` build output. However, Prisma generates **native binary files** that:
1. Are platform-specific (different for Mac, Linux, etc.)
2. Live in `node_modules/.prisma/client/`
3. Must be explicitly included in deployment artifacts

This is a **common gotcha** when deploying Prisma apps to:
- AWS Amplify
- Vercel (handles this automatically)
- Netlify (handles this automatically)
- Custom Lambda deployments (requires manual configuration like this)

## 🎓 Key Learnings

### Always Include in Amplify Deployments:
1. ✅ `.next/` - Next.js build output
2. ✅ `node_modules/` - All dependencies (or at least production ones)
3. ✅ `package.json` - Dependency manifest
4. ✅ Any native binaries (Prisma, sharp, etc.)

### Prisma-Specific Requirements:
- ✅ `binaryTargets` in schema.prisma
- ✅ Include `node_modules/.prisma/client/` in artifacts
- ✅ Include `node_modules/@prisma/client/` in artifacts
- ✅ Run `prisma generate` during build

## 🆘 If Still Getting Errors

### Check Build Logs For:
1. "✔ Generated Prisma Client" - Should appear
2. "libquery_engine-rhel-openssl-3.0.x.so.node" - Should be listed
3. Artifact size - Should be larger (~100MB+) due to node_modules

### Common Issues:

**Issue**: Binary verification shows "Prisma binaries not found"
**Solution**: Check that `prisma/schema.prisma` has `binaryTargets = ["native", "rhel-openssl-3.0.x"]`

**Issue**: Artifact upload fails (too large)
**Solution**: Consider using layers or excluding dev dependencies

**Issue**: Still getting Prisma errors
**Solution**: Check CloudWatch logs for specific error message

## 🎉 Success Indicators

After deployment, you should see in CloudWatch logs:
```
✅ No PrismaClientInitializationError
✅ Database queries succeed
✅ App loads without errors
```

And when visiting your app:
```
✅ Home page loads
✅ Tournaments display
✅ Sign up works
✅ Login works
✅ Create tournament works (coach/admin)
```

---

**Status**: Ready to deploy! This fix addresses the Prisma binary packaging issue. 🚀

