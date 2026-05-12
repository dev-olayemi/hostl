# Compose — Full Feature Spec

## Message Types

| Type | Purpose | Recipient action |
|------|---------|-----------------|
| Message | Plain/rich text or HTML | Read, reply, forward |
| Approval | Request sign-off | Approve / Decline |
| RSVP | Event invitation | Yes / No / Maybe |
| Poll | Single question vote | Pick option(s), see results |
| Survey | Multi-question form | Answer all, submit |
| HTML Form | Custom HTML form | Fill and submit |

## Type 2: Approval — form_schema
```json
{
  "type": "approval",
  "request": "Leave request for 3 days",
  "details": "June 10-12, annual leave",
  "deadline": "2026-06-01",
  "options": ["Approve", "Decline"]
}
```

## Type 3: RSVP — form_schema
```json
{
  "type": "rsvp",
  "event_name": "Team Offsite Q3",
  "date": "2026-06-20T09:00:00",
  "location": "Lagos, Nigeria",
  "description": "Annual team offsite.",
  "deadline": "2026-06-15",
  "options": ["Yes, I will be there", "Cannot make it", "Maybe"]
}
```

## Type 4: Poll — form_schema
```json
{
  "type": "poll",
  "question": "Which day works best?",
  "options": ["Monday", "Tuesday", "Wednesday"],
  "allow_multiple": false,
  "anonymous": false,
  "end_date": "2026-06-10"
}
```

## Type 5: Survey — form_schema
```json
{
  "type": "survey",
  "questions": [
    { "id": "q1", "text": "How satisfied are you?", "type": "rating", "required": true },
    { "id": "q2", "text": "Which features do you use?", "type": "multiple_choice",
      "options": ["Messaging","Approvals","RSVP"], "allow_multiple": true, "required": false },
    { "id": "q3", "text": "Any comments?", "type": "long_text", "required": false }
  ]
}
```

Question types: short_text | long_text | multiple_choice | yes_no | rating | date

## Response storage (message_responses table)
```json
{ "action": "approved" }
{ "option": "Yes, I will be there" }
{ "selected": ["Tuesday"] }
{ "q1": 4, "q2": ["Messaging"], "q3": "Great!" }
```

## Migration needed
Run docs/migrations/011_message_responses.sql
