// ─── Account Types ────────────────────────────────────────────────────────────

export type AccountType = 'personal' | 'company' | 'organization'

export interface HostlProfile {
  id: string
  handle: string
  display_name: string
  account_type: AccountType
  avatar_url: string | null
  bio: string | null
  verified: boolean
  is_system: boolean        // true only for the @hostl platform account
  created_at: string
  updated_at: string
}

// ─── Message / Thread Types ───────────────────────────────────────────────────

export type MessageCategory = 'inbox' | 'important' | 'sent' | 'drafts' | 'archived' | 'trash' | 'isolated' | 'suspicious'

export type MessageContentType = 'text' | 'html_form' | 'approval' | 'rsvp' | 'survey'

export interface Message {
  id: string
  thread_id: string
  from_profile_id: string
  to_profile_id: string
  subject: string
  body: string
  content_type: MessageContentType
  is_read: boolean
  is_important: boolean
  category: MessageCategory
  action_completed: boolean
  action_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Joined
  from_profile?: HostlProfile
  to_profile?: HostlProfile
}

export interface Label {
  id: string
  profile_id: string
  name: string
  color: string
  created_at: string
}

export interface Thread {
  id: string
  subject: string
  participants: string[] // profile ids
  last_message_at: string
  messages?: Message[]
}

// ─── Auth / Onboarding ────────────────────────────────────────────────────────

export interface SignupFormData {
  first_name: string
  last_name: string
  date_of_birth: string
  handle: string
  email: string
  password: string
  account_type: AccountType
}
