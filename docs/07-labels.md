# 07 — Labels, Isolation & Mass Message

## Labels

Users can create custom labels to organize messages.

### DB tables
- labels: id, profile_id, name, color
- message_labels: message_id, label_id (junction)

### Label colors (presets)
#6366f1, #8b5cf6, #ec4899, #ef4444, #f97316, #eab308, #22c55e, #14b8a6, #3b82f6, #06b6d4, #64748b, #1e293b

### Server actions (src/app/(app)/labels/actions.ts)
- getLabels() — fetch all labels for current user
- createLabel(name, color)
- updateLabel(id, name, color)
- deleteLabel(id)
- applyLabel(messageId, labelId)
- removeLabel(messageId, labelId)
- getMessagesByLabel(labelId)

## Isolated inbox

Route: /inbox/isolated
Category: isolated
Purpose: Messages from senders the user has never interacted with.
Currently: manually move messages there via archive-style action.
Future: auto-route messages from non-contacts to isolated.

## Suspicious inbox

Route: /inbox/suspicious
Category: suspicious
Purpose: Messages from reported or blocked senders.
Currently: manually move messages there.
Future: auto-route when sender has reports against them.

## Mass message

Route: /compose/mass
Max recipients: 50
Each recipient gets an individual thread (not a group message).

### Flow
1. Enter handles (comma/newline separated)
2. Live count shows X/50
3. Pick message type + write body
4. Submit → sendMassMessage() server action
5. Creates one thread + one message per recipient
6. Tracked in mass_messages table
7. Success screen shows sent count

### Server action: src/app/(app)/compose/mass-actions.ts
- sendMassMessage(formData)
- Validates all handles exist
- Creates threads in a loop
- Updates mass_messages.status to done

## Protocol handler

Route: /protocol?url=...
Registered as: web+hostl://

Allows external apps (WhatsApp, Twitter, email) to link to Hostl:
- web+hostl:@muhammed → /compose?to=muhammed
- web+hostl:@a,@b → /compose?to=a,b
- web+hostl://compose?to=handle → /compose?to=handle

Registration: navigator.registerProtocolHandler() called in ProtocolHandler.tsx
Mounted in: src/app/(app)/layout.tsx

## Public profile pages

Route: /u/[handle]
Example: hostl.net/u/muhammed

Shows:
- Avatar, display name, verified badges
- Bio, account type
- "Send a message to @handle" button → /compose?to=handle
- Share link hint

No auth required to view. Auth required to send.
