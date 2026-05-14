# Test Messages for Security System

## Test 1: High Risk - Should be ISOLATED (Score: 0-29)

**Subject:** Urgent: Account Suspended - Verify Now

**Body:**
```
Dear User,

Your account has been suspended due to suspicious activity.

URGENT ACTION REQUIRED: Click here immediately to verify your account and confirm your password.

If you don't verify within 24 hours, your account will be permanently deleted.

Verify now: bit.ly/verify-account-urgent

Thank you,
Security Team
```

**Expected Result:**
- Category: Isolated
- Score: 0-20
- Flags: 5-6 (suspended account, urgent action, click here immediately, verify account, confirm password, bit.ly)
- Severity: Multiple HIGH flags

---

## Test 2: Medium Risk - Should be SUSPICIOUS (Score: 30-59)

**Subject:** You've Won a Prize!

**Body:**
```
Congratulations!

You've been selected as a winner in our monthly lottery draw.

To claim your prize, please send a wire transfer of $50 for processing fees to:
Western Union - Account #12345

Your prize: $10,000 in bitcoin

Act fast - offer expires soon!
```

**Expected Result:**
- Category: Suspicious
- Score: 30-50
- Flags: 4-5 (lottery winner, wire transfer, western union, bitcoin)
- Severity: Multiple MEDIUM flags

---

## Test 3: Low Risk - Should be INBOX (Score: 60-100)

**Subject:** Meeting Tomorrow

**Body:**
```
Hi,

Just confirming our meeting tomorrow at 2pm in the conference room.

I'll bring the project documents we discussed.

See you then!
```

**Expected Result:**
- Category: Inbox
- Score: 100
- Flags: 0
- Severity: None

---

## Test 4: Borderline - Should be SUSPICIOUS (Score: 40-59)

**Subject:** Password Reset Request

**Body:**
```
Hello,

We received a request to reset your password.

Click this link to reset: tinyurl.com/reset123

If you didn't request this, please ignore.
```

**Expected Result:**
- Category: Suspicious
- Score: 40-55
- Flags: 1-2 (tinyurl.com)
- Severity: MEDIUM

---

## Test 5: Attachment Risk - Should be ISOLATED (Score: 0-29)

**Subject:** Invoice Attached

**Body:**
```
Please find the invoice attached.

Payment is due immediately.
```

**Attachment:** invoice.exe (or invoice.bat)

**Expected Result:**
- Category: Isolated
- Score: 0-30
- Flags: 1-2 (.exe attachment, "immediately")
- Severity: HIGH

---

## Test 6: Multiple Weak Signals - Should be SUSPICIOUS (Score: 30-50)

**Subject:** Special Offer

**Body:**
```
Limited time offer!

Click here to see our exclusive deals.

Visit: bit.ly/deals

Don't miss out!
```

**Expected Result:**
- Category: Suspicious
- Score: 35-50
- Flags: 2 (click here, bit.ly)
- Severity: MEDIUM

---

## Test 7: Trusted Sender Test

**First, mark sender as trusted, then send:**

**Subject:** Urgent: Please verify this document

**Body:**
```
Hey,

Can you verify your account details in this document?

Click here to download: bit.ly/doc123

Thanks!
```

**Expected Result:**
- Category: Inbox (trusted sender protection)
- Score: 60+ (severity reduced by 50%)
- Flags: 2-3 (but with reduced severity)
- Severity: LOW (context: trusted sender)

---

## Test 8: Existing Conversation Test

**After exchanging 5+ messages with someone, send:**

**Subject:** Here's the file

**Body:**
```
Attached is the installer we discussed.
```

**Attachment:** setup.exe

**Expected Result:**
- Category: Inbox (conversation protection)
- Score: 50-70 (severity reduced by 30%)
- Flags: 1 (.exe but reduced severity)
- Severity: MEDIUM (context: existing conversation)

---

## Test 9: Extreme Phishing - Should be ISOLATED (Score: 0)

**Subject:** URGENT: IRS Tax Refund Pending

**Body:**
```
URGENT ACTION REQUIRED

Your tax refund of $5,000 is pending.

You've won the IRS lottery! The Nigerian Prince has approved your inheritance.

Click here immediately to verify your account and confirm your password: bit.ly/irs-refund

Wire transfer $100 to claim via Western Union.

Send bitcoin to: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

**Expected Result:**
- Category: Isolated
- Score: 0 (multiple high-severity patterns)
- Flags: 10+ (every pattern triggered)
- Severity: Multiple HIGH flags

---

## Test 10: Clean Professional Email - Should be INBOX (Score: 100)

**Subject:** Q4 Report Review

**Body:**
```
Hi Team,

Please review the attached Q4 financial report before our meeting on Friday.

Key highlights:
- Revenue increased 15%
- Customer satisfaction at 92%
- New product launch successful

Let me know if you have any questions.

Best regards,
John
```

**Attachment:** Q4_Report.pdf

**Expected Result:**
- Category: Inbox
- Score: 100
- Flags: 0
- Severity: None

---

## Quick Test Commands

### Test from Command Line (if you have API access):

```bash
# Test 1: High Risk
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "testuser",
    "subject": "Urgent: Account Suspended",
    "body": "Your account has been suspended. Click here immediately to verify your password: bit.ly/verify"
  }'

# Test 2: Clean Message
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "testuser",
    "subject": "Meeting Tomorrow",
    "body": "Just confirming our meeting tomorrow at 2pm."
  }'
```

---

## Expected Behavior Summary

| Test | Subject | Expected Category | Expected Score | Flag Count |
|------|---------|------------------|----------------|------------|
| 1 | Account Suspended | Isolated | 0-20 | 5-6 |
| 2 | Won a Prize | Suspicious | 30-50 | 4-5 |
| 3 | Meeting Tomorrow | Inbox | 100 | 0 |
| 4 | Password Reset | Suspicious | 40-55 | 1-2 |
| 5 | Invoice (.exe) | Isolated | 0-30 | 1-2 |
| 6 | Special Offer | Suspicious | 35-50 | 2 |
| 7 | Trusted Sender | Inbox | 60+ | 2-3 |
| 8 | Existing Conv | Inbox | 50-70 | 1 |
| 9 | Extreme Phishing | Isolated | 0 | 10+ |
| 10 | Q4 Report | Inbox | 100 | 0 |

---

## Testing Checklist

- [ ] Test 1: High risk message isolated
- [ ] Test 2: Medium risk message flagged as suspicious
- [ ] Test 3: Clean message goes to inbox
- [ ] Test 4: Borderline message flagged
- [ ] Test 5: Dangerous attachment isolated
- [ ] Test 6: Multiple weak signals flagged
- [ ] Test 7: Trusted sender protection works
- [ ] Test 8: Conversation history protection works
- [ ] Test 9: Extreme phishing isolated
- [ ] Test 10: Professional email clean

- [ ] Security flags display correctly
- [ ] Trust score shows accurate number
- [ ] Severity badges show (High/Medium/Low)
- [ ] Context information displays
- [ ] Warning messages show for suspicious/isolated
- [ ] Category counts update after filtering

---

## Notes

- **First Contact**: Messages from new senders get 1.2x severity multiplier
- **Trusted Senders**: Get 0.5x severity multiplier (never isolated)
- **Existing Conversations**: Get 0.7x severity multiplier (5+ messages)
- **Multiple Patterns**: Multiple weak signals = strong signal
- **Minimum Scores**: Trusted senders minimum 60, conversations minimum 50

---

## Debugging

If filtering doesn't work:

1. Check message was sent successfully
2. Check `/api/filter-message` was called
3. Check database for `security_score` and `security_flags`
4. Check message `category` field
5. Refresh inbox to see updated category

```sql
-- Check message security data
SELECT id, subject, category, security_score, security_flags
FROM messages
WHERE subject LIKE '%Urgent%'
ORDER BY created_at DESC
LIMIT 1;
```

Happy testing! 🧪🛡️
