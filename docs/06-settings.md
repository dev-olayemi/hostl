# 06 — Settings & Profile

## Settings page: /settings

### Profile picture (Avatar)
- Upload: JPG, PNG, WebP, GIF, SVG — max 2MB
- GIFs skip crop (preserving animation)
- Other formats go through crop + rotate screen
- Crop is circular, aspect ratio 1:1
- Zoom slider + 90-degree rotate button
- Uploaded to Cloudinary: hostl/avatars/{userId}
- Cloudinary applies face-aware crop (400x400) for non-GIF
- URL saved to profiles.avatar_url
- Cloudinary public_id saved to profiles.avatar_public_id
- 3 options: Browse illustrations (DiceBear), Upload from device, Take a picture

### Identity section
- First name, last name (editable)
- Bio (editable)
- Gender: male|female|non_binary|prefer_not_to_say
- Hostl ID (@handle) — READ ONLY, cannot be changed

### Contact & location
- Phone number with country code picker (flag + dial code, searchable)
- Country picker (searchable with flags)
- Home address

### Security & recovery
- Recovery Hostl ID — 2-step verification:
  1. Enter target @handle
  2. System sends H-XXXXXXX code to that handle via Hostl message
  3. User enters code to confirm
  4. recovery_handle saved to profiles
- Change password link → /forgot-password

### Verification (company/org/service/commerce/government only)
- Links to /settings/verify
- Shows current status if application exists

## Avatar upload API

Route: POST /api/upload-avatar

Request: multipart/form-data with file field
Response: { url: string, public_id: string }

Validation:
- Types: image/jpeg, image/png, image/webp, image/gif, image/svg+xml
- Max size: 2MB
- Auth required (checks Supabase session)

Cloudinary config:
- Cloud name: dtelqmqjf
- Folder: hostl/avatars
- Public ID: {userId} (overwrites previous avatar)
- GIF: resize only (preserves animation)
- Others: face-aware crop to 400x400, auto quality/format

## Labels: /settings/labels

- Create labels with name + color (12 preset colors)
- Edit name and color inline
- Delete labels
- Labels appear in sidebar
- Each label has its own inbox at /inbox/label/[id]
- Apply labels to messages via message actions

## Files

- `src/app/(app)/settings/page.tsx` — server component, fetches profile
- `src/app/(app)/settings/SettingsClient.tsx` — full settings form
- `src/app/(app)/settings/actions.ts` — updateProfile()
- `src/app/(app)/settings/recovery-actions.ts` — sendRecoveryVerificationCode(), verifyRecoveryCode()
- `src/app/(app)/settings/verify/page.tsx` — verification application
- `src/app/(app)/settings/verify/VerificationForm.tsx`
- `src/app/(app)/settings/verify/actions.ts` — submitVerification(), getVerificationStatus()
- `src/app/(app)/settings/labels/page.tsx`
- `src/app/(app)/settings/labels/LabelsSettingsClient.tsx`
- `src/app/api/upload-avatar/route.ts` — Cloudinary upload
- `src/components/settings/AvatarUpload.tsx` — crop/rotate UI
- `src/lib/countries.ts` — 60+ countries with ISO codes, dial codes, flag emojis
