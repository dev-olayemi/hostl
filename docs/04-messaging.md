# 04 — Messaging System

## Message content types

| Type | Description | Action UI |
|------|-------------|----------|
| text | Plain or rich text message | None |
| html_form | Raw HTML content | Submit button |
| approval | Approval request | Approve / Decline |
| rsvp | Event invitation | Yes / No |
| survey | Survey / questionnaire | Submit response |

## Sending a message

1. User goes to /compose
2. Adds recipients (To + CC, up to 4 each)
3. As user types @handle, live lookup checks profiles table
4. Verified Hostl handles show avatar + display name
5. Picks message type (text/approval/rsvp/survey)
6. Writes body in rich text editor (Tiptap) or raw HTML
7. HTML mode has live preview
8. Submits → sendMessage() server action

## sendMessage() flow

1. Verify user session
2. Get sender profile
3. Look up all recipient handles in profiles table
4. Return error if any handle not found
5. Create thread row
6. Add all participants to thread_participants
7. Insert one message row per recipient
8. Redirect to /inbox/sent

## Mass message

- Route: /compose/mass
- Up to 50 recipients
- Handles entered as comma/newline separated list
- Each recipient gets an individual thread (not a group message)
- Tracked in mass_messages table with status: pending|sending|done|failed

## Inbox categories

| Category | Description |
|----------|-------------|
| inbox | Default received messages |
| important | Starred messages |
| sent | Messages sent by user |
| drafts | Saved drafts (future) |
| archived | Archived messages |
| trash | Deleted messages |
| isolated | Messages from unknown senders |
| suspicious | Flagged/reported sender messages |

## Message actions

All actions are in `src/app/(app)/message-actions.ts`.
All use the admin client — security enforced by auth.getUser() check.

| Action | Function | Notes |
|--------|----------|-------|
| Archive | archiveMessage(id) | Sets category=archived |
| Trash | trashMessage(id) | Sets category=trash |
| Mark read | markRead(id, bool) | Only recipient can mark read |
| Mark important | markImportant(id, bool) | Star/unstar |
| Snooze | snoozeMessage(id, until) | Sets snoozed_until |
| Mute | muteMessage(id, bool) | Sets muted=true |
| Bulk read | bulkMarkRead(ids, bool) | |
| Bulk archive | bulkArchive(ids) | |
| Bulk trash | bulkTrash(ids) | |
| Bulk important | bulkMarkImportant(ids, bool) | |
| Report | reportMessage(id, handle, reason) | Saves to reports table |
| Block | blockUser(handle) | Saves to blocked_users table |

## @handle detection in messages

When rendering plain text messages, `MessageBody.tsx` scans for @handle patterns.
It verifies each candidate against the profiles table.
Only real Hostl handles are highlighted and made clickable.
Clicking opens /compose?to=handle.

This avoids false positives from Twitter/Instagram handles.

## Reply / Forward

Reply: navigates to /compose?reply=ID&to=handle&subject=Re: Subject
Forward: navigates to /compose?forward=ID&subject=Fwd: Subject
ComposeView reads URL params and pre-fills the form.

## Files

- `src/app/(app)/actions.ts` — sendMessage()
- `src/app/(app)/compose/mass-actions.ts` — sendMassMessage()
- `src/app/(app)/message-actions.ts` — all message actions
- `src/components/inbox/InboxClient.tsx` — inbox list + bulk actions
- `src/components/inbox/MessageRow.tsx` — single message row
- `src/components/inbox/MessageDetail.tsx` — full message view
- `src/components/inbox/MessageBody.tsx` — smart @handle rendering
- `src/components/inbox/ComposeView.tsx` — compose form
- `src/components/inbox/MassComposeView.tsx` — mass message form
- `src/components/inbox/RichEditor.tsx` — Tiptap rich text editor
- `src/lib/db/messages.ts` — server-side message fetch helpers
