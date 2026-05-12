/**
 * Hostl system account constants.
 * The @hostl account sends verification codes, system notifications, etc.
 * It is a special profile that exists in the profiles table but has no
 * corresponding auth.users row — it's managed entirely by the service role.
 */

export const SYSTEM_PROFILE_ID = '00000000-0000-0000-0000-000000000001'
export const SYSTEM_HANDLE = 'hostl'
export const SYSTEM_DISPLAY_NAME = 'Hostl'
export const SYSTEM_AVATAR_URL = '/hostl-icon.png'

/** Returns true if a profile is the Hostl platform system account */
export function isSystemProfile(profile: { id?: string; is_system?: boolean } | null | undefined): boolean {
  if (!profile) return false
  // Primary check: the fixed system UUID
  if (profile.id === SYSTEM_PROFILE_ID) return true
  // Secondary check: explicit flag (set in DB, can't be faked by users via RLS)
  if (profile.is_system === true) return true
  return false
}

/** Generate a verification code like H-647GF74 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'H-'
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
