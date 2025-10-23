# AWS Amplify Deployment - Final Solution

## Problem Summary

Multiple attempts to deploy the Next.js app to AWS Amplify failed with various errors:
1. Missing dependencies (Tailwind, TypeScript, Prisma)
2. Missing Prisma query engine binary
3. `Can't find required-server-files.json` error

## Root Cause

**We were trying to use Next.js `standalone` output mode, but AWS Amplify Hosting Compute has its own infrastructure for SSR apps.**

According to [AWS documentation](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html#build-setting-detection-ssg-14):
- Amplify Hosting Compute "fully manages the resources required to deploy an SSR app"
- Amplify expects `baseDirectory: .next` with the standard Next.js build output
- Standalone mode is for Docker/custom Node.js deployments, **not for Amplify**

## The Solution

### 1. **Remove Standalone Mode**

Update `next.config.mjs` to only use `export` mode for demo builds:

```javascript
const nextConfig = {
  // Enable static export for demo mode only (AWS Amplify handles SSR natively)
  output: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'export' : undefined,
  // ... rest of config
}
```

**Why**: AWS Amplify has its own SSR infrastructure and doesn't need standalone mode.

### 2. **Simplify Build Configuration**

Update `amplify.yml` to use standard SSR deployment:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 20
        - nvm use 20
        - npm ci
        - npx prisma generate
        - ls -la node_modules/.prisma/client/*.node
        - npx prisma migrate deploy || echo "Migration failed, continuing..."
    build:
      commands:
        - npm run build
        - find node_modules/.prisma/client -name "*rhel-openssl-3.0.x.so.node" -ls
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**Why**: Let Amplify handle the deployment infrastructure natively.

### 3. **Keep Prisma Binary Targets**

Keep the `binaryTargets` in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

**Why**: Amplify's Lambda functions run on RHEL, so we need the correct binary.

### 4. **Keep Build Dependencies**

Keep Tailwind, TypeScript, Prisma, and other build tools in `dependencies` (not `devDependencies`):

```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "prisma": "^6.18.0",
    "typescript": "^5",
    "@types/node": "^20",
    // ... other build dependencies
  }
}
```

**Why**: Amplify's build process needs these to compile the app.

## How AWS Amplify SSR Works

1. **Build Phase**: Amplify runs `npm run build` which creates `.next/` directory
2. **Deployment**: Amplify takes the entire `.next/` output and deploys it to Lambda@Edge
3. **Runtime**: Amplify's infrastructure manages:
   - Lambda functions for SSR
   - CloudFront distribution for static assets
   - Automatic routing between static and dynamic pages
   - Node.js runtime environment

## Key Differences: Standalone vs Amplify Native

| Feature | Standalone Mode | Amplify Native SSR |
|---------|----------------|-------------------|
| Purpose | Docker/custom Node.js | AWS Amplify Hosting |
| Output | `.next/standalone/` | `.next/` |
| Dependencies | Minimal, self-contained | Full build output |
| Infrastructure | You manage | Amplify manages |
| Server File | `server.js` | Managed by Amplify |

## What We Learned

1. ❌ **Don't use** `output: 'standalone'` with AWS Amplify
2. ✅ **Do use** standard Next.js build with `baseDirectory: .next`
3. ✅ **Do keep** build tools in `dependencies` for Amplify
4. ✅ **Do configure** Prisma binary targets for Lambda runtime
5. ✅ **Do let** Amplify manage the SSR infrastructure

## References

- [AWS Amplify Next.js SSR Deployment](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files)
- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)

## Previous Attempts (For Reference)

- `AMPLIFY_TROUBLESHOOTING.md` - Initial dependency issues
- `FIX_AMPLIFY_RUNTIME_ERROR.md` - Prisma binary target fix
- `AMPLIFY_ARTIFACTS_FIX.md` - First artifacts config attempt
- `AMPLIFY_STANDALONE_FIX.md` - Standalone mode attempt (incorrect approach)

## Result

✅ **Deployment should now work** using AWS Amplify's native SSR infrastructure with proper Prisma binary support.

