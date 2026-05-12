# 02 — Database Schema

## Migrations

All migrations are in `docs/migrations/`. Run them in order in Supabase SQL Editor.

| File | Description |
|------|-------------|
| schema.sql | Base schema — all tables, RLS, triggers |
| 002_actions.sql | snoozed_until, muted, reports, blocked_users |
| 003_verification.sql | verification_requests table |
| 004_profile_fields.sql | gender, phone, country, address, recovery_handle, avatar_public_id |
| 005_labels.sql | labels, message_labels, mass_messages, isolated/suspicious categories |
| 006_system_and_recovery.sql | recovery_handle_verifications |
| 006b_system_profile.sql | @hostl system account (drops FK, inserts, restores) |
| 006c_recovery_unique.sql | Unique constraint on recovery_handle_verifications.profile_id |
| 007_account_types.sql | Extended account types (government, service, commerce) |
| 008_system_account_type.sql | Sets @hostl account_type to service |
| 009_system_flag.sql | is_system boolean column, set true for @hostl |
| 010_fix_messages_rls.sql | Fixes messages RLS policies |

## Tables

### profiles
One row per user. Created automatically by trigger on auth.users insert.

```sql
id              uuid PK (= auth.users.id)
handle          text UNIQUE NOT NULL  -- @handle, lowercase, 2-30 chars
display_name    text NOT NULL
first_name      text NOT NULL
last_name       text NOT NULL
date_of_birth   date NOT NULL
account_type    text  -- personal|company|organization|government|service|commerce
verified        boolean DEFAULT false
is_system       boolean DEFAULT false  -- true only for @hostl
avatar_url      text
avatar_public_id text  -- Cloudinary public_id
bio             text
recovery_handle text  -- @handle of recovery account (verified)
gender          text  -- male|female|non_binary|prefer_not_to_say
phone_number    text
phone_country   text  -- ISO 3166-1 alpha-2
country         text  -- ISO 3166-1 alpha-2
address         text
website         text
location        text
created_at      timestamptz
updated_at      timestamptz
```

### messages

```sql
id                uuid PK
thread_id         uuid FK threads
from_profile_id   uuid FK profiles
to_profile_id     uuid FK profiles
subject           text NOT NULL
body              text NOT NULL
content_type      text  -- text|html_form|approval|rsvp|survey
form_schema       jsonb  -- for html_form/survey
is_read           boolean DEFAULT false
is_important      boolean DEFAULT false
category          text  -- inbox|important|sent|drafts|archived|trash|isolated|suspicious
action_completed  boolean DEFAULT false
action_response   text  -- approved|declined|submitted
action_data       jsonb
action_at         timestamptz
snoozed_until     timestamptz
muted             boolean DEFAULT false
created_at        timestamptz
updated_at        timestamptz
```

### threads

```sql
id              uuid PK
subject         text NOT NULL
created_by      uuid FK profiles
last_message_at timestamptz
created_at      timestamptz
```

### thread_participants

```sql
thread_id   uuid FK threads
profile_id  uuid FK profiles
joined_at   timestamptz
PRIMARY KEY (thread_id, profile_id)
```

### labels

```sql
id          uuid PK
profile_id  uuid FK profiles
name        text NOT NULL
color       text NOT NULL  -- hex color
created_at  timestamptz
UNIQUE (profile_id, name)
```

### message_labels

```sql
message_id  uuid FK messages
label_id    uuid FK labels
PRIMARY KEY (message_id, label_id)
```

### reports

```sql
id               uuid PK
reporter_id      uuid FK profiles
message_id       uuid FK messages
reported_handle  text NOT NULL
reason           text  -- spam|harassment|phishing|impersonation|other
notes            text
resolved         boolean DEFAULT false
created_at       timestamptz
```

### blocked_users

```sql
blocker_id  uuid FK profiles
blocked_id  uuid FK profiles
created_at  timestamptz
PRIMARY KEY (blocker_id, blocked_id)
```

### verification_requests

```sql
id              uuid PK
profile_id      uuid FK profiles UNIQUE
legal_name      text NOT NULL
account_type    text NOT NULL
website         text NOT NULL
country         text NOT NULL
city            text
address         text
registration_number text
description     text NOT NULL
contact_name    text NOT NULL
contact_title   text NOT NULL
contact_email   text NOT NULL
status          text  -- pending|under_review|approved|rejected
rejection_reason text
reviewed_by     text
reviewed_at     timestamptz
created_at      timestamptz
updated_at      timestamptz
```

### recovery_handle_verifications

```sql
id              uuid PK
profile_id      uuid FK profiles UNIQUE
target_handle   text NOT NULL
code            text NOT NULL  -- e.g. H-EAVE5N4
verified        boolean DEFAULT false
expires_at      timestamptz  -- 24 hours from creation
created_at      timestamptz
```

### account_settings

```sql
profile_id          uuid PK FK profiles
theme               text  -- light|dark|system
notifications_email boolean DEFAULT false
notifications_push  boolean DEFAULT true
language            text DEFAULT en
timezone            text DEFAULT UTC
updated_at          timestamptz
```

### mass_messages

```sql
id              uuid PK
sender_id       uuid FK profiles
subject         text NOT NULL
body            text NOT NULL
content_type    text DEFAULT text
recipient_count int DEFAULT 0
sent_count      int DEFAULT 0
status          text  -- pending|sending|done|failed
created_at      timestamptz
```

## System Profile

The @hostl system account has a fixed UUID:
```
id: 00000000-0000-0000-0000-000000000001
handle: hostl
account_type: service
verified: true
is_system: true
avatar_url: /hostl-icon.png
```

This account sends system messages (recovery codes, notifications). It has no real auth.users session. The profiles FK was temporarily dropped to insert it.

## Triggers

- `on_auth_user_created` — creates profile + account_settings row on signup
- `messages_update_thread` — updates thread.last_message_at on new message
- `profiles_updated_at`, `messages_updated_at`, `account_settings_updated_at` — auto-update timestamps
