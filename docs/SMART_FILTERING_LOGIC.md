# Smart Context-Aware Filtering Logic

## Philosophy

**Balance security with usability** - Don't block legitimate users while protecting against threats.

## Core Principle

> **Context matters more than content**

A `.exe` file from your colleague is different from one from a stranger.

---

## Truth Table Logic

### Factors Considered

| Factor | Weight | Impact |
|--------|--------|--------|
| Sender Reputation | High | 0.5x - 1.3x severity multiplier |
| Conversation History | Medium | 0.7x severity multiplier |
| Pattern Severity | Variable | Base detection |
| Pattern Count | High | Multiple weak = strong |
| Account Verification | Medium | +15 reputation |
| Account Age | Medium | +5 to +20 reputation |

---

## Sender Reputation System

### Reputation Score (0-100)

**Starting Point:** 50 (neutral)

**Bonuses:**
- Account age > 1 year: +20
- Account age > 6 months: +15
- Account age > 3 months: +10
- Account age > 1 month: +5
- Verified account: +15
- Active user (100+ messages): +15
- Active user (50+ messages): +10
- Active user (10+ messages): +5

**Penalties:**
- Account age < 7 days: -10
- 10+ spam reports: -40
- 5+ spam reports: -25
- 2+ spam reports: -15

**Reputation Tiers:**
- **80-100**: Trusted (severity × 0.5)
- **60-79**: Good (severity × 0.7)
- **40-59**: Neutral (severity × 1.0)
- **20-39**: Suspicious (severity × 1.2)
- **0-19**: Poor (severity × 1.3)

---

## Context Modifiers

### 1. Trusted Sender (Rep ≥ 80)
```
Pattern severity × 0.5
Minimum score: 60 (never isolated)
```

**Example:**
- `.exe` attachment: 50 → 25 severity
- "verify account": 50 → 25 severity
- Result: Flagged but not blocked

### 2. Existing Conversation (5+ messages)
```
Pattern severity × 0.7
Combined with reputation
```

**Example:**
- Colleague sends `.exe` (rep: 70, conversation: 10 messages)
- Multiplier: 0.7 (good rep) × 0.7 (conversation) = 0.49
- `.exe` severity: 50 × 0.49 = 24.5
- Result: Minimal impact

### 3. First Contact (No history)
```
Pattern severity × 1.2
More cautious with strangers
```

**Example:**
- Stranger sends `.exe` (rep: 40, no history)
- Multiplier: 1.0 (neutral) × 1.2 (first contact) = 1.2
- `.exe` severity: 50 × 1.2 = 60
- Result: Significant impact

---

## Decision Matrix

### Scenario 1: Trusted Sender + Suspicious Content

**Input:**
- Sender reputation: 85 (trusted)
- Content: "Please verify your account" + `.exe` attachment
- Conversation: 20 messages

**Calculation:**
```
Base score: 100
Multiplier: 0.5 (trusted) × 0.7 (conversation) = 0.35

"verify account" (50) × 0.35 = 17.5
".exe" (50) × 0.35 = 17.5

Score: 100 - 17.5 - 17.5 = 65
Minimum for trusted: 60
Final: 65
```

**Result:** ✅ Inbox (flagged for awareness)

---

### Scenario 2: Stranger + Suspicious Content

**Input:**
- Sender reputation: 35 (suspicious)
- Content: "Urgent! Verify your account" + `.exe` attachment
- Conversation: None

**Calculation:**
```
Base score: 100
Multiplier: 1.2 (suspicious) × 1.2 (first contact) = 1.44

"urgent" (45) × 1.44 = 64.8
"verify account" (50) × 1.44 = 72
".exe" (50) × 1.44 = 72

Score: 100 - 64.8 - 72 - 72 = -108.8
Capped at: 0
```

**Result:** 🚫 Isolated

---

### Scenario 3: Colleague + Legitimate File

**Input:**
- Sender reputation: 75 (good)
- Content: "Here's the installer" + `.exe` attachment
- Conversation: 50 messages

**Calculation:**
```
Base score: 100
Multiplier: 0.7 (good rep) × 0.7 (conversation) = 0.49

".exe" (50) × 0.49 = 24.5

Score: 100 - 24.5 = 75.5
```

**Result:** ✅ Inbox (minor flag)

---

### Scenario 4: New User + Normal Content

**Input:**
- Sender reputation: 45 (neutral, new account)
- Content: "Hi, I saw your profile"
- Conversation: None

**Calculation:**
```
Base score: 100
Multiplier: 1.0 (neutral) × 1.2 (first contact) = 1.2

No patterns detected

Score: 100
```

**Result:** ✅ Inbox

---

### Scenario 5: Multiple Weak Signals

**Input:**
- Sender reputation: 50 (neutral)
- Content: "Click here for bitcoin lottery winner!"
- Conversation: None

**Calculation:**
```
Base score: 100
Multiplier: 1.0 × 1.2 = 1.2

"click here" (50) × 1.2 = 60
"bitcoin" (35) × 1.2 = 42
"lottery winner" (70) × 1.2 = 84

Score: 100 - 60 - 42 - 84 = -86
Capped at: 0

High severity count: 3
```

**Result:** 🚫 Isolated (multiple strong signals)

---

## Smart Overrides

### Override 1: Trusted Sender Protection
```sql
if sender_reputation >= 80 then
  if base_score < 60 then
    base_score := 60  -- Never isolate trusted senders
  end if
end if
```

### Override 2: Established Conversation
```sql
if conversation_exists and message_count > 10 then
  if base_score < 50 then
    base_score := 50  -- Protect ongoing conversations
  end if
end if
```

### Override 3: Multiple High-Severity Patterns
```sql
if high_severity_count >= 3 or 
   (high_severity_count >= 2 and not conversation_exists) then
  if base_score > 40 then
    base_score := 40  -- Cap suspicious messages
  end if
end if
```

---

## Pattern Severity Adjustments

### Original vs Context-Aware

| Pattern | Original | Trusted | Conversation | Stranger |
|---------|----------|---------|--------------|----------|
| .exe | 100 | 50 | 70 | 120 |
| .bat | 95 | 47.5 | 66.5 | 114 |
| .zip | 60 | 30 | 42 | 72 |
| "verify account" | 85 | 42.5 | 59.5 | 102 |
| "bitcoin" | 70 | 35 | 49 | 84 |
| bit.ly | 80 | 40 | 56 | 96 |

---

## Real-World Examples

### ✅ Legitimate: Developer Sharing Code

```
Sender: @john (rep: 82, verified, 200+ messages)
Conversation: 30 messages over 3 months
Content: "Here's the build script"
Attachment: deploy.bat

Calculation:
- Multiplier: 0.5 × 0.7 = 0.35
- .bat (60) × 0.35 = 21
- Score: 100 - 21 = 79

Result: Inbox ✅
Reason: Trusted sender, established relationship
```

---

### 🚫 Phishing: Fake Bank Alert

```
Sender: @support-bank (rep: 25, new account, 0 messages)
Conversation: None (first contact)
Content: "Urgent! Your account has been suspended. 
         Verify your password immediately: bit.ly/verify"

Calculation:
- Multiplier: 1.2 × 1.2 = 1.44
- "urgent" (45) × 1.44 = 64.8
- "suspended account" (55) × 1.44 = 79.2
- "verify your password" (60) × 1.44 = 86.4
- "immediately" (50) × 1.44 = 72
- "bit.ly" (40) × 1.44 = 57.6
- Score: 100 - 360 = -260 → 0

Result: Isolated 🚫
Reason: Multiple high-severity patterns, new sender
```

---

### ⚠️ Suspicious: Borderline Case

```
Sender: @marketing (rep: 55, 3 months old, 50 messages)
Conversation: None
Content: "Exclusive offer! Click here to claim your prize"

Calculation:
- Multiplier: 1.0 × 1.2 = 1.2
- "click here" (50) × 1.2 = 60
- "claim your prize" (implied in "lottery") = 0
- Score: 100 - 60 = 40

Result: Suspicious ⚠️
Reason: Borderline content, no relationship
```

---

## User Controls

### 1. Mark as Trusted
```
Effect: Sender reputation → 100
Future messages: Always inbox
Override: All pattern detection
```

### 2. Block Sender
```
Effect: All messages → Isolated
Score: 0
Override: Immediate quarantine
```

### 3. Report as Spam
```
Effect: Sender reputation -15
Pattern learning: Flag similar content
Community protection: Shared patterns
```

---

## Advantages of This System

### 1. Context-Aware
- ✅ Considers sender reputation
- ✅ Considers relationship history
- ✅ Considers account age
- ✅ Considers verification status

### 2. Balanced
- ✅ Protects against threats
- ✅ Doesn't block legitimate users
- ✅ Learns from user behavior
- ✅ Adapts to context

### 3. Transparent
- ✅ Shows why message was flagged
- ✅ Shows original vs adjusted severity
- ✅ Shows context factors
- ✅ User can override

### 4. Fair
- ✅ New users can build reputation
- ✅ Trusted users have flexibility
- ✅ Mistakes can be corrected
- ✅ Appeals are possible

---

## Comparison: Old vs New

### Old System (Too Strict)

```
.exe attachment → Isolated (always)
"verify account" → Isolated (always)
No context considered
High false positive rate
```

### New System (Smart)

```
.exe from trusted colleague → Inbox (flagged)
.exe from stranger → Isolated
"verify account" from bank → Inbox (if trusted)
"verify account" from stranger → Suspicious/Isolated
Context-aware decisions
Low false positive rate
```

---

## Summary

The smart filtering system uses:

1. **Sender Reputation** (0-100)
2. **Conversation History** (message count)
3. **Pattern Detection** (keywords, URLs, attachments)
4. **Context Modifiers** (0.5x - 1.3x)
5. **Smart Overrides** (protect legitimate users)

**Result:** Balanced security that protects users without blocking legitimate communication.

---

## Testing Scenarios

### Test 1: Trusted Sender
```sql
-- Create trusted sender
INSERT INTO sender_reputation (profile_id, reputation_score)
VALUES ('user-id', 85);

-- Send suspicious message
-- Expected: Inbox (flagged)
```

### Test 2: New Stranger
```sql
-- New account (< 7 days)
-- Send suspicious message
-- Expected: Isolated
```

### Test 3: Established Conversation
```sql
-- 20+ messages exchanged
-- Send .exe file
-- Expected: Inbox (minor flag)
```

Your users are protected intelligently! 🧠🛡️
