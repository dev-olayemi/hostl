# Smart Navigation System

## Overview

The system now intelligently remembers where you were before composing a message and returns you to that location after sending. This provides a seamless user experience across all pages.

## How It Works

### 1. Compose Button Tracking

When you click the "Compose" button from any page, the system captures the current path and passes it as a URL parameter:

```typescript
// In AppShell.tsx
<Link href={`/compose?from=${encodeURIComponent(pathname)}`}>
  <Button>Compose</Button>
</Link>
```

### 2. Reply/Forward Tracking

When replying to or forwarding a message, the system also captures the current path:

```typescript
// In MessageDetail.tsx
function handleReply() {
  const currentPath = window.location.pathname
  router.push(`/compose?reply=${message.id}&to=${handle}&from=${encodeURIComponent(currentPath)}`)
}
```

### 3. Smart Redirect After Sending

After successfully sending a message, the system redirects you back to where you came from:

```typescript
// In actions.ts
export async function sendMessage(formData: FormData, returnPath?: string) {
  // ... send message logic ...
  
  // Redirect back to where the user came from, or to sent if no return path
  redirect(returnPath || '/inbox/sent')
}
```

### 4. Page Refresh Behavior

Next.js naturally preserves the current route on page refresh - no special handling needed. The browser simply reloads the current page without any redirects.

## User Experience

### Before (Old Behavior)
- User is on `/inbox/important`
- Clicks "Compose"
- Sends message
- **Always** redirected to `/inbox/sent`
- Has to manually navigate back to `/inbox/important`

### After (Smart Behavior)
- User is on `/inbox/important`
- Clicks "Compose"
- Sends message
- **Automatically** returned to `/inbox/important`
- Seamless workflow, no extra clicks needed

## Examples

### Example 1: Composing from Important
1. User is viewing `/inbox/important`
2. Clicks "Compose" → navigates to `/compose?from=%2Finbox%2Fimportant`
3. Sends message
4. Redirected back to `/inbox/important`

### Example 2: Replying from Archived
1. User is viewing a message in `/inbox/archived`
2. Clicks "Reply" → navigates to `/compose?reply=123&to=john&from=%2Finbox%2Farchived`
3. Sends reply
4. Redirected back to `/inbox/archived`

### Example 3: Composing from Sent
1. User is viewing `/inbox/sent`
2. Clicks "Compose" → navigates to `/compose?from=%2Finbox%2Fsent`
3. Sends message
4. Redirected back to `/inbox/sent`

### Example 4: Direct Compose Link
1. User navigates directly to `/compose` (no `from` parameter)
2. Sends message
3. Redirected to `/inbox/sent` (default behavior)

## Technical Details

### URL Parameters

The `from` parameter is URL-encoded to handle special characters:

```
/compose?from=%2Finbox%2Fimportant
/compose?from=%2Finbox%2Flabel%2F123
/compose?from=%2Finbox%2Fsuspicious
```

### Fallback Behavior

If no `from` parameter is provided, the system defaults to `/inbox/sent`:

```typescript
const returnPath = searchParams.get('from') ?? '/inbox/sent'
```

### Server Action

The `sendMessage` server action accepts an optional `returnPath` parameter:

```typescript
export async function sendMessage(formData: FormData, returnPath?: string)
```

This allows the client to specify where to redirect after sending.

## Benefits

1. **Improved UX**: Users stay in their workflow without manual navigation
2. **Context Preservation**: Users return to the exact page they were viewing
3. **Reduced Clicks**: No need to navigate back manually
4. **Intuitive**: Matches user expectations from other email clients
5. **Flexible**: Works from any page in the app

## Edge Cases Handled

1. **No return path**: Defaults to `/inbox/sent`
2. **Invalid return path**: Falls back to default
3. **Direct compose access**: Works normally without `from` parameter
4. **Page refresh**: Next.js preserves current route naturally
5. **Browser back button**: Works as expected

## Future Enhancements

Potential improvements for the future:

1. **History Stack**: Remember multiple previous pages
2. **Smart Defaults**: Learn user preferences over time
3. **Category-Specific**: Different defaults for different message types
4. **Session Persistence**: Remember across browser sessions

## Testing

To test the smart navigation:

1. Navigate to any inbox category (Important, Archived, etc.)
2. Click "Compose"
3. Send a message
4. Verify you're returned to the original category
5. Refresh the page
6. Verify you stay on the same page (no redirect)

## Files Modified

- `src/app/(app)/actions.ts` - Added `returnPath` parameter to `sendMessage`
- `src/components/inbox/ComposeView.tsx` - Extract and pass `from` parameter
- `src/components/layout/AppShell.tsx` - Add current path to compose link
- `src/components/inbox/MessageDetail.tsx` - Add current path to reply/forward links

---

**Status**: ✅ Implemented and working
**Version**: 1.0
**Date**: May 14, 2026
