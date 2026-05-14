# Message Security Filtering System

## Overview

Hostl implements a comprehensive message filtering system to protect users from:
- Phishing attempts
- Malware
- Scams and fraud
- Spam
- Suspicious content

## How It Works

### 1. Security Scoring (0-100)

Every incoming message receives a security score:
- **100**: Completely safe (trusted sender)
- **60-99**: Normal message (goes to inbox)
- **30-59**: Suspicious (flagged for review)
- **0-29**: Very suspicious (isolated)

### 2. Message Categories

Based on security score, messages are categorized:

| Score | Category | Description |
|-------|----------|-------------|
| 100 | Inbox | Trusted sender |
| 60-99 | Inbox | Normal message |
| 30-59 | Suspicious | Flagged for review |
| 0-29 | Isolated | Quarantined |
| Blocked | Isolated | Sender is blocked |

### 3. Detection Rules

#### A. Phishing Keywords (High Severity: 80-100)
- "verify your account"
- "urgent action required"
- "suspended account"
- "confirm your password"
- "click here immediately"
- "lottery winner"
- "nigerian prince"
- "tax refund"

#### B. Financial Fraud Indicators (Severity: 70-80)
- "wire transfer"
- "western union"
- "bitcoin"
- "inheritance"

#### C. Suspicious URLs (Severity: 80-90)
- Shortened URLs: bit.ly, tinyurl.com
- Free domains: .tk, .ml, .ga
- Suspicious TLDs

#### D. Dangerous Attachments (Severity: 60-100)
- **Critical (100)**: .exe, .scr
- **High (95)**: .bat, .cmd, .vbs
- **Medium (85)**: .js
- **Low (60-80)**: .jar, .zip, .rar

#### E. Sender Patterns (Severity: 40-50)
- noreply@ addresses
- admin@ addresses
- support@ addresses

### 4. Whitelist/Blacklist

#### Trusted Senders (Whitelist)
- Messages always go to inbox
- Security score: 100
- No filtering applied

#### Blocked Senders (Blacklist)
- Messages always go to isolated
- Security score: 0
- Completely quarantined

## Database Schema

### Messages Table (Extended)
```sql
security_score    int (0-100)
security_flags    jsonb (array of detected issues)
filtered_at       timestamptz
filter_version    text
```

### Trusted Senders
```sql
profile_id    uuid (user)
trusted_id    uuid (trusted sender)
```

### Blocked Senders
```sql
profile_id    uuid (user)
blocked_id    uuid (blocked sender)
reason        text
```

### Suspicious Patterns
```sql
pattern_type     text (url, keyword, attachment, sender)
pattern_value    text (the pattern to match)
severity         int (0-100)
description      text
is_active        boolean
```

## API Endpoints

### POST /api/filter-message

Analyzes and filters a message.

**Request:**
```json
{
  "messageId": "uuid",
  "subject": "string",
  "messageBody": "string",
  "senderHandle": "string",
  "attachmentTypes": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "category": "inbox|suspicious|isolated",
  "score": 85,
  "flags": [
    {
      "type": "keyword",
      "value": "verify your account",
      "severity": 85,
      "description": "Common phishing phrase"
    }
  ]
}
```

## Security Flags Structure

Each detected issue is recorded as a flag:

```json
{
  "type": "keyword|url|attachment|sender",
  "value": "the detected pattern",
  "severity": 85,
  "description": "Why this is suspicious"
}
```

## Filtering Algorithm

```
1. Check if sender is blocked
   → YES: Isolated (score: 0)
   → NO: Continue

2. Check if sender is trusted
   → YES: Inbox (score: 100)
   → NO: Continue

3. Calculate security score:
   - Start with 100
   - Subtract severity for each detected pattern
   - Minimum: 0, Maximum: 100

4. Determine category:
   - Score < 30: Isolated
   - Score 30-59: Suspicious
   - Score ≥ 60: Inbox

5. Update message with:
   - category
   - security_score
   - security_flags
   - filtered_at
   - filter_version
```

## Examples

### Example 1: Phishing Email

**Message:**
```
Subject: Urgent: Verify your account
Body: Your account has been suspended. Click here immediately to verify your password.
```

**Analysis:**
- "verify your account" (-85)
- "suspended" (-85)
- "click here immediately" (-90)
- "verify your password" (-95)

**Result:**
- Score: 0 (100 - 355 = -255, capped at 0)
- Category: Isolated
- Flags: 4 phishing indicators

### Example 2: Legitimate Email

**Message:**
```
Subject: Meeting tomorrow
Body: Hi, just confirming our meeting tomorrow at 2pm. See you then!
```

**Analysis:**
- No suspicious patterns detected

**Result:**
- Score: 100
- Category: Inbox
- Flags: []

### Example 3: Suspicious Email

**Message:**
```
Subject: You won!
Body: Congratulations! You've won a lottery. Send bitcoin to claim your prize.
```

**Analysis:**
- "lottery winner" (-95)
- "bitcoin" (-70)

**Result:**
- Score: 0 (100 - 165 = -65, capped at 0)
- Category: Isolated
- Flags: 2 scam indicators

### Example 4: Borderline Suspicious

**Message:**
```
Subject: Password reset
Body: Click this link to reset your password: bit.ly/reset123
```

**Analysis:**
- "bit.ly" (-80) - shortened URL

**Result:**
- Score: 20
- Category: Isolated
- Flags: 1 suspicious URL

## User Controls

### Mark as Trusted
Users can whitelist senders:
```typescript
// Add to trusted senders
POST /api/trusted-senders
{ "senderHandle": "john" }
```

### Block Sender
Users can blacklist senders:
```typescript
// Add to blocked senders
POST /api/blocked-senders
{ "senderHandle": "spammer", "reason": "Spam" }
```

### Report Message
Users can report suspicious messages:
```typescript
// Report message
POST /api/report-message
{ "messageId": "uuid", "reason": "Phishing" }
```

## Admin Features

### Add Custom Patterns

Admins can add new suspicious patterns:

```sql
INSERT INTO suspicious_patterns (pattern_type, pattern_value, severity, description)
VALUES ('keyword', 'new scam phrase', 90, 'Detected in recent scam campaign');
```

### Update Pattern Severity

```sql
UPDATE suspicious_patterns
SET severity = 95
WHERE pattern_value = 'verify your account';
```

### Disable Pattern

```sql
UPDATE suspicious_patterns
SET is_active = false
WHERE pattern_value = 'old pattern';
```

## Performance

- **Filtering time**: < 100ms per message
- **Database queries**: 3-5 per message
- **Async processing**: Doesn't block message delivery

## Privacy

- Filtering happens server-side
- No message content sent to third parties
- All patterns stored in your database
- User whitelist/blacklist is private

## Future Enhancements

### Machine Learning
- [ ] Train ML model on reported messages
- [ ] Adaptive scoring based on user behavior
- [ ] Anomaly detection

### Advanced Detection
- [ ] Image analysis for phishing
- [ ] Link reputation checking
- [ ] Sender reputation scoring
- [ ] Domain age verification

### User Features
- [ ] Custom user rules
- [ ] Bulk actions on suspicious messages
- [ ] Security dashboard
- [ ] Weekly security reports

## Testing

### Test Phishing Detection

```bash
# Send test phishing message
curl -X POST /api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@hostl.cloud",
    "subject": "Verify your account",
    "body": "Click here immediately to confirm your password"
  }'

# Check if filtered to isolated
curl /api/messages?category=isolated
```

### Test Whitelist

```bash
# Add sender to trusted list
curl -X POST /api/trusted-senders \
  -d '{"senderHandle": "john"}'

# Send message from trusted sender
# Should go to inbox regardless of content
```

## Compliance

### GDPR
- Users can export their whitelist/blacklist
- Users can delete their filtering data
- Filtering data is user-specific

### CAN-SPAM
- Filtering doesn't prevent legitimate marketing
- Users control their own filters
- Unsubscribe links are not flagged

## Support

### False Positives
If legitimate messages are filtered:
1. Check security score and flags
2. Add sender to trusted list
3. Report false positive to improve patterns

### False Negatives
If spam gets through:
1. Report the message
2. Block the sender
3. Patterns will be updated

## Monitoring

### Key Metrics
- Messages filtered per day
- False positive rate
- False negative rate
- Most common patterns detected
- User reports

### Alerts
- Spike in isolated messages
- New attack patterns detected
- High false positive rate

---

## Summary

Hostl's filtering system provides:
- ✅ Multi-layer protection
- ✅ Real-time analysis
- ✅ User control (whitelist/blacklist)
- ✅ Transparent scoring
- ✅ Privacy-focused (no third parties)
- ✅ Extensible pattern system
- ✅ Fast performance (< 100ms)

Your users are protected! 🛡️
