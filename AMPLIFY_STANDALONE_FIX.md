# AWS Amplify Standalone Build Fix

## Problem

After enabling standalone output mode for AWS Amplify deployment, the application was failing at runtime with:

```
Error [PrismaClientInitializationError]: Invalid `prisma.tournament.findMany()` invocation: 
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

The error showed Prisma was searching in:
- `/tmp/app/node_modules/.prisma/client`
- `/var/task/node_modules/@prisma/client`
- `/var/task/node_modules/.prisma/client`

But the query engine binary `libquery_engine-rhel-openssl-3.0.x.so.node` was not present.

## Root Causes

1. **Nested Standalone Build**: Next.js was creating a nested standalone structure (`/next/standalone/elastic-repos/claytargettracker/`) due to workspace detection issues.

2. **Missing Prisma Binaries**: The standalone build process creates a minimal `node_modules` directory but doesn't automatically include Prisma's native query engine binaries.

3. **Missing Static Files**: Static assets and public files weren't being copied to the standalone directory.

## Solution

### 1. Fixed Next.js Root Detection

Updated `next.config.mjs` to explicitly set the output file tracing root:

```javascript
experimental: {
  outputFileTracingRoot: process.cwd(),
}
```

This prevents the nested standalone build structure and ensures files are output to `.next/standalone/` directly.

### 2. Copy Required Files to Standalone

Updated `amplify.yml` build commands to copy all necessary files:

```yaml
build:
  commands:
    - npm run build
    # Copy static files
    - cp -r .next/static .next/standalone/.next/static
    - cp -r public .next/standalone/public
    # Copy Prisma files
    - mkdir -p .next/standalone/node_modules/.prisma
    - cp -r node_modules/.prisma/client .next/standalone/node_modules/.prisma/
    - mkdir -p .next/standalone/node_modules/@prisma
    - cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/
    # Copy prisma schema
    - cp -r prisma .next/standalone/
    # Verify binaries
    - ls -la .next/standalone/node_modules/.prisma/client/*.node
```

### 3. Set Correct Artifacts BaseDirectory

```yaml
artifacts:
  baseDirectory: .next/standalone
  files:
    - '**/*'
```

## What Gets Copied

The build process now ensures these critical files are in the standalone directory:

1. **Prisma Query Engine Binaries**:
   - `libquery_engine-darwin-arm64.dylib.node` (for local dev)
   - `libquery_engine-rhel-openssl-3.0.x.so.node` (for AWS Lambda) ✅

2. **Static Assets**:
   - `.next/static/*` - Built JavaScript, CSS, and other static files

3. **Public Files**:
   - `public/*` - Images, fonts, and other public assets

4. **Prisma Schema**:
   - `prisma/schema.prisma` - For runtime schema access
   - `prisma/migrations/` - Migration history

## Verification

To verify locally:

```bash
npm run build

# Check standalone structure
ls -la .next/standalone/

# Verify Prisma binaries (after copy commands)
ls -la .next/standalone/node_modules/.prisma/client/*.node
```

You should see both binary files listed.

## Why This Matters

Next.js standalone mode creates a self-contained deployment that includes:
- The server code
- Minimal runtime dependencies
- Node.js modules needed for production

However, it doesn't automatically include:
- Native binary modules (like Prisma's query engine)
- Static files from the build
- Public assets

AWS Amplify's Lambda@Edge functions need all files self-contained in the deployment package, so we must explicitly copy them during the build.

## Related Files

- `next.config.mjs` - Next.js configuration with standalone output
- `amplify.yml` - Build specification for AWS Amplify
- `prisma/schema.prisma` - Prisma schema with Lambda binary target
- `AMPLIFY_ARTIFACTS_FIX.md` - Previous artifacts configuration fix
- `FIX_AMPLIFY_RUNTIME_ERROR.md` - Initial Prisma binary target fix

## References

- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Next.js outputFileTracingRoot](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files)
- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)
- [AWS Lambda Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)

