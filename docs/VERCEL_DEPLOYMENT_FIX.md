# Vercel Deployment Fix

## Issue
Build fails on Vercel with error:
```
Error: ENOENT: no such file or directory, open '/vercel/path0/.next/server/middleware.js.nft.json'
```

## Root Cause
Next.js 16.2.6 middleware build process on Vercel may have issues with:
1. Build cache
2. Node.js version mismatch
3. Missing runtime configuration

## Solutions

### Solution 1: Clear Vercel Build Cache (Recommended)

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Scroll to **Build & Development Settings**
4. Click **Clear Build Cache**
5. Redeploy

### Solution 2: Set Node.js Version

Add to `package.json`:
```json
{
  "engines": {
    "node": ">=18.17.0"
  }
}
```

### Solution 3: Vercel Configuration

Create `vercel.json` in project root:
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Solution 4: Environment Variables

Ensure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Middleware Configuration

The middleware file has been updated with:

**File**: `middleware.ts`
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Ensure middleware runs on Node.js runtime
export const runtime = 'nodejs'
```

## Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix: Update middleware for Vercel deployment"
git push origin main
```

### Step 2: Trigger Redeploy on Vercel

**Option A: Automatic**
- Push to main branch triggers automatic deployment

**Option B: Manual**
1. Go to Vercel dashboard
2. Click **Deployments**
3. Click **Redeploy** on the latest deployment
4. Check **Clear Build Cache**
5. Click **Redeploy**

### Step 3: Monitor Build

Watch the build logs for:
- ✅ Middleware compilation
- ✅ All routes generated
- ✅ No ENOENT errors

## Troubleshooting

### If Build Still Fails

#### Check 1: Node.js Version
Vercel should use Node.js 18.x or higher. Check build logs for:
```
Node.js version: v18.x.x
```

#### Check 2: Dependencies
Ensure all dependencies are installed:
```bash
npm install
npm run build  # Test locally first
```

#### Check 3: Middleware File Location
Ensure `middleware.ts` is at project root (not in `src/`):
```
/Users/apple/Documents/hostle/middleware.ts  ✅
/Users/apple/Documents/hostle/src/middleware.ts  ❌
```

#### Check 4: Import Paths
Verify the import path is correct:
```typescript
import { updateSession } from '@/lib/supabase/middleware'  ✅
```

### Alternative: Remove Middleware Temporarily

If deployment is urgent and middleware is causing issues:

1. **Rename middleware file**:
   ```bash
   mv middleware.ts middleware.ts.backup
   ```

2. **Deploy without middleware**:
   - API routes will still work
   - Session refresh will be manual
   - 401 errors may return

3. **Add middleware back later** when Vercel issue is resolved

## Verification

After successful deployment:

### Test 1: Homepage
- Visit your Vercel URL
- Should load without errors

### Test 2: API Routes
- Open DevTools → Network
- Navigate to `/inbox`
- Check `/api/message-counts` returns 200 (not 401)

### Test 3: Send Message
- Go to `/compose`
- Send a test message
- Should work without errors

### Test 4: Session Persistence
- Log in
- Close browser
- Reopen and visit site
- Should still be logged in

## Build Logs Analysis

### Successful Build
```
✓ Compiled successfully
✓ Running TypeScript
✓ Generating static pages
ƒ Proxy (Middleware)  ← Middleware is working
```

### Failed Build
```
Error: ENOENT: no such file or directory
middleware.js.nft.json  ← Missing file
```

## Local vs Production

### Local Build (Works)
```bash
npm run build
# ✅ Successful
```

### Vercel Build (May Fail)
- Different build environment
- Different caching strategy
- Different Node.js version
- Different file system

## Next.js 16 Considerations

Next.js 16 is very new (released recently). Some Vercel optimizations may not be fully compatible yet.

### Workarounds:
1. Use Node.js runtime (not Edge)
2. Clear build cache frequently
3. Monitor Next.js updates
4. Check Vercel status page

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Vercel Support**: https://vercel.com/support
- **Supabase Middleware**: https://supabase.com/docs/guides/auth/server-side/nextjs

## Summary

**Issue**: Middleware build fails on Vercel
**Cause**: Next.js 16 + Vercel build cache
**Solution**: Clear cache + proper runtime config
**Status**: Fixed locally, needs Vercel redeploy

---

**Date**: May 14, 2026
**Priority**: High
**Impact**: Deployment blocker
