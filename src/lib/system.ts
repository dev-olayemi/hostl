/**
 * Hostl system account constants.
 * The @hostl account sends verification codes, system notifications, etc.
 * It is a special profile that exists in the profiles table but has no
 * corresponding auth.users row — it's managed entirely by the service role.
 */

export const SYSTEM_PROFILE_ID = '00000000-0000-0000-0000-000000000001'
export const SYSTEM_HANDLE = 'hostl'
export const SYSTEM_DISPLAY_NAME = 'Hostl'
export const SYSTEM_AVATAR_URL = '/hostl-icon.png' // served from public/

/** Generate a verification code like H-647GF74 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = 'H-'
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
