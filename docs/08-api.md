# 08 — API Reference

## API Routes

### POST /api/upload-avatar
Upload and crop user avatar to Cloudinary.

Auth: Required (Supabase session cookie)
Content-Type: multipart/form-data

Body:
- file: image file (JPG/PNG/WebP/GIF/SVG, max 2MB)

Response:
```json
{ "url": "https://res.cloudinary.com/...", "public_id": "hostl/avatars/..." }
```

Errors:
- 401: Not authenticated
- 400: No file / invalid type / too large

## Server Actions

All server actions are in src/app/. They use the admin Supabase client.
Security: every action calls auth.getUser() first.

### Auth actions (src/app/(auth)/actions.ts)

```typescript
signUp(formData: FormData): Promise<{ error?: string, redirect?: string }>
signIn(formData: FormData): Promise<{ error?: string, redirect?: string }>
signOut(): Promise<void>
forgotPassword(formData: FormData): Promise<{ error?: string, success?: boolean }>
resetPassword(formData: FormData): Promise<{ error?: string }>
checkHandleAvailable(handle: string): Promise<{ available: boolean }>
```

### Message actions (src/app/(app)/actions.ts)

```typescript
sendMessage(formData: FormData): Promise<{ error?: string }>
// formData fields: to, cc, subject, body, content_type
```

### Message actions (src/app/(app)/message-actions.ts)

```typescript
archiveMessage(messageId: string)
trashMessage(messageId: string)
markRead(messageId: string, isRead: boolean)
markImportant(messageId: string, isImportant: boolean)
snoozeMessage(messageId: string, until: string)
muteMessage(messageId: string, muted: boolean)
bulkMarkRead(messageIds: string[], isRead: boolean)
bulkArchive(messageIds: string[])
bulkTrash(messageIds: string[])
bulkMarkImportant(messageIds: string[], isImportant: boolean)
reportMessage(messageId: string, reportedHandle: string, reason: string)
blockUser(handleToBlock: string)
```

### Label actions (src/app/(app)/labels/actions.ts)

```typescript
getLabels(): Promise<Label[]>
createLabel(name: string, color: string): Promise<{ label?: Label, error?: string }>
updateLabel(id: string, name: string, color: string)
deleteLabel(id: string)
applyLabel(messageId: string, labelId: string)
removeLabel(messageId: string, labelId: string)
getMessagesByLabel(labelId: string)
```

### Settings actions (src/app/(app)/settings/actions.ts)

```typescript
getProfile(): Promise<Profile | null>
updateProfile(formData: FormData): Promise<{ error?: string, success?: boolean }>
// formData fields: first_name, last_name, bio, gender, country,
//   phone_country, phone_number, address, recovery_handle
```

### Recovery actions (src/app/(app)/settings/recovery-actions.ts)

```typescript
sendRecoveryVerificationCode(targetHandle: string)
// Returns: { success, targetHandle, messageWarning? } | { error }

verifyRecoveryCode(code: string)
// Returns: { success, handle } | { error }
```

### Verification actions (src/app/(app)/settings/verify/actions.ts)

```typescript
submitVerification(formData: FormData)
// formData: legal_name, website, country, city, address,
//   registration_number, description, contact_name, contact_title, contact_email

getVerificationStatus(): Promise<VerificationRequest | null>
```

### Mass message (src/app/(app)/compose/mass-actions.ts)

```typescript
sendMassMessage(formData: FormData)
// formData: handles (comma-separated), subject, body, content_type
// Returns: { success, sent: number } | { error }
```

## DB helpers (src/lib/db/messages.ts)

```typescript
getInboxMessages(userId: string, category: string): Promise<Message[]>
getSentMessages(userId: string): Promise<Message[]>
```

These use the admin client and bypass RLS. Used by server components.

## System constants (src/lib/system.ts)

```typescript
SYSTEM_PROFILE_ID = "00000000-0000-0000-0000-000000000001"
SYSTEM_HANDLE = "hostl"
SYSTEM_DISPLAY_NAME = "Hostl"
SYSTEM_AVATAR_URL = "/hostl-icon.png"

generateVerificationCode(): string  // Returns H-XXXXXXX
isSystemProfile(profile): boolean   // Checks UUID + is_system flag
```
