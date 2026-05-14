# Implementation Plan - Feature Enhancements

## Status Overview

### ✅ Already Implemented
1. **Zoom Prevention on Inputs** - Global CSS rule applies `font-size: 16px !important` to all inputs
2. **New Device Sign-in Detection** - System distinguishes between welcome message (first login) and device sign-in alerts (new device)

### 🚧 In Progress
3. **Attachments Feature** - Database migration and upload API created, needs UI integration
4. **Approval/RSVP/Survey Web UI** - Basic structure exists, needs full interactive implementation
5. **Optimized User Search** - Current exact-match search needs fuzzy search with efficient algorithm

---

## 1. Attachments Feature

### Database Schema ✅
- Created `attachments` table with file deduplication via SHA-256 hash
- Created `message_attachments` junction table
- RLS policies for secure access
- Max file size: 25MB
- Supported types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, images, ZIP

### Upload API ✅
- `/api/upload-attachment` route created
- Cloudinary integration for file storage
- Automatic deduplication - same file uploaded once, referenced multiple times
- Returns attachment metadata

### TODO:
- [ ] Add attachment UI to ComposeView
  - File picker button
  - Attachment preview list with remove option
  - Upload progress indicator
  - File size/type validation feedback
- [ ] Update `sendMessage` action to link attachments to messages
- [ ] Add attachment display in MessageDetail
  - Download button
  - File icon based on mime type
  - File size display
- [ ] Add attachment query to message fetching

---

## 2. Interactive Message Types (Approval/RSVP/Survey)

### Current State
- Message types defined in database
- Basic UI shows type badge
- Placeholder buttons exist but don't submit responses

### TODO:
- [ ] Create `/api/message-response` route to handle submissions
- [ ] Update MessageDetail to:
  - Parse `form_schema` from message
  - Render approval buttons (Approve/Decline)
  - Render RSVP options (Yes/No/Maybe)
  - Render survey forms with questions
  - Submit responses to API
  - Show submitted state
- [ ] Add form builders to ComposeView for each type:
  - Approval: request text, details, deadline
  - RSVP: event name, date, location, description
  - Survey: question builder with types (rating, multiple choice, text)
- [ ] Store form_schema in message on send
- [ ] Display response aggregation for senders

---

## 3. Optimized User Search

### Current Implementation
- Exact handle match only
- Direct Supabase query with 400ms debounce
- O(n) linear search in database

### Proposed Solution
**Implement Trie-based fuzzy search with PostgreSQL full-text search**

#### Backend:
- [ ] Add `search_vector` column to profiles table (tsvector)
- [ ] Create GIN index on search_vector for O(log n) lookups
- [ ] Update profiles on insert/update to populate search_vector
- [ ] Create `/api/search-users` endpoint with:
  - Full-text search using `ts_query`
  - Fuzzy matching with trigram similarity (pg_trgm extension)
  - Ranking by relevance
  - Limit results to top 10

#### Frontend:
- [ ] Update RecipientInput to use new search API
- [ ] Show multiple suggestions (not just exact match)
- [ ] Highlight matching portions of handle/name
- [ ] Add keyboard navigation (arrow keys, enter to select)

#### Algorithm Complexity:
- Current: O(n) - scans all profiles
- Proposed: O(log n) - GIN index lookup
- With 1M users: ~20x faster

---

## 4. Additional Improvements

### Compose Page Enhancements
- [ ] Add draft auto-save
- [ ] Add recipient validation before send
- [ ] Add character count for subject/body
- [ ] Add send scheduling option

### Message Detail Enhancements
- [ ] Add attachment preview modal
- [ ] Add response analytics for interactive messages
- [ ] Add thread view (group related messages)
- [ ] Add quick actions (archive, delete, star) on swipe (mobile)

---

## Priority Order

1. **High Priority**
   - Attachments UI in ComposeView
   - Attachments display in MessageDetail
   - Interactive message response API
   - Approval/RSVP UI in MessageDetail

2. **Medium Priority**
   - Survey form builder in ComposeView
   - User search optimization
   - Response aggregation display

3. **Low Priority**
   - Draft auto-save
   - Send scheduling
   - Thread view

---

## Files to Modify

### Attachments
- `/src/components/inbox/ComposeView.tsx` - Add file picker and attachment list
- `/src/app/(app)/actions.ts` - Update sendMessage to handle attachments
- `/src/components/inbox/MessageDetail.tsx` - Display attachments
- `/src/app/(app)/inbox/page.tsx` - Include attachments in message query

### Interactive Messages
- `/src/app/api/message-response/route.ts` - New file for response handling
- `/src/components/inbox/MessageDetail.tsx` - Add interactive UI
- `/src/components/inbox/ComposeView.tsx` - Add form builders
- `/src/components/inbox/ApprovalForm.tsx` - New component
- `/src/components/inbox/RSVPForm.tsx` - New component
- `/src/components/inbox/SurveyForm.tsx` - New component

### User Search
- `/docs/migrations/016_search_optimization.sql` - New migration
- `/src/app/api/search-users/route.ts` - New search endpoint
- `/src/components/inbox/ComposeView.tsx` - Update RecipientInput

---

## Next Steps

1. Complete attachments feature (UI + integration)
2. Implement message response API
3. Build interactive message UI
4. Optimize user search
5. Test all features end-to-end
