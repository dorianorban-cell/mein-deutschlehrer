# Mein Deutschlehrer — Task Checklist

Work through these tasks in strict order.
Mark each task [x] as soon as it is done.
Never skip ahead. Each task depends on the previous one.

---

## PHASE 1 — Project Setup
- [x] 1.1 Run `npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
- [x] 1.2 Install dependencies: `npm install @anthropic-ai/sdk openai @prisma/client prisma`
- [x] 1.3 Create prisma/schema.prisma with full schema (Profile, Session, Message, Mistake)
- [x] 1.4 Run `npx prisma db push` to create the SQLite database
- [x] 1.5 Create lib/db.ts with Prisma client singleton
- [x] 1.6 Create lib/prompts.ts with buildSystemPrompt() function
- [x] 1.7 Verify app runs: `npm run dev` → open http://localhost:3000

---

## PHASE 2 — Profile Selector
- [x] 2.1 Create app/page.tsx — "Wer bist du?" screen
- [x] 2.2 Create POST /api/profiles/route.ts — create new profile
- [x] 2.3 Create GET /api/profiles/route.ts — list all profiles
- [x] 2.4 Create components/ProfileSelector.tsx — profile cards UI
- [x] 2.5 Add "+ Neues Profil" button with name + level form
- [x] 2.6 Clicking a profile navigates to /[profileId]
- [x] 2.7 Test: create 2 profiles, navigate to each one

---

## PHASE 3 — Voice Pipeline
- [x] 3.1 Create POST /api/transcribe/route.ts — audio blob → Whisper → transcript
- [x] 3.2 Create POST /api/chat/route.ts — transcript + profileId → Claude → response
- [x] 3.3 Create POST /api/speak/route.ts — text → OpenAI TTS → audio stream
- [x] 3.4 Create components/VoiceButton.tsx — press/hold to record, release to send
- [x] 3.5 Create app/[profileId]/page.tsx — conversation screen
- [x] 3.6 Wire up: VoiceButton → transcribe → chat → speak → play audio
- [x] 3.7 Add text input fallback below voice button
- [x] 3.8 Test full voice loop: speak → hear response back

---

## PHASE 4 — Corrections Display
- [x] 4.1 Parse <corrections> JSON block from Claude response in /api/chat
- [x] 4.2 Parse <remember> tags from Claude response in /api/chat
- [x] 4.3 Create components/ConversationFeed.tsx — show messages with corrections highlighted
- [x] 4.4 Corrections shown inline: red strikethrough original → green corrected
- [x] 4.5 Create components/MistakePanel.tsx — live sidebar showing today's errors
- [x] 4.6 Add 8 topic suggestion chips at top of conversation screen
- [x] 4.7 Test: make a deliberate grammar mistake, verify it shows in corrections panel

---

## PHASE 5 — Database Persistence + Memory
- [x] 5.1 Save each message to Message table in /api/chat
- [x] 5.2 Create/close Session records (startedAt on first message, endedAt on leave)
- [x] 5.3 Save corrections to Mistake table — increment count if same error seen before
- [x] 5.4 Save <remember> facts to Profile.facts array
- [x] 5.5 Load Profile.facts and inject into system prompt at start of each session
- [x] 5.6 Test: say something personal, close app, reopen — verify Max remembers it
- [x] 5.7 Test: make same mistake twice — verify count increments to 2

---

## PHASE 6 — Mistake Report
- [x] 6.1 Create GET /api/report/route.ts — return all mistakes for a profileId
- [x] 6.2 Create app/[profileId]/report/page.tsx — report page
- [x] 6.3 Header: profile name + "Generated: Wednesday, 11 March 2026" format
- [x] 6.4 Header line 2: "Tracking since: DD MMM YYYY · N mistakes logged"
- [x] 6.5 Build "By Category" tab — grouped, sorted by count, with full dates on each entry
- [x] 6.6 Build "By Date" tab — reverse chronological sessions, 🆕 new / ⚠️ recurring tags
- [x] 6.7 Colour coding: red border = 3+ times | yellow = 2 | grey = 1
- [x] 6.8 Add "Copy Report" button — copies full markdown with dates to clipboard
- [x] 6.9 Add "📊 Report" link in conversation screen header
- [x] 6.10 Test: verify dates are correct and both tab views work

---

## PHASE 7 — Mobile + Polish
- [x] 7.1 Test on mobile browser — open http://[your-ip]:3000 on phone
- [x] 7.2 Fix any layout issues on small screen
- [x] 7.3 Conversation screen: mistake panel hidden behind toggle button on mobile
- [x] 7.4 Voice button large enough to press comfortably on phone
- [x] 7.5 Test voice recording works on mobile Chrome and Safari
- [x] 7.6 Add app title and favicon

---

## PHASE 8 — Deploy to Vercel
- [ ] 8.1 Create .gitignore — make sure .env.local is in it
- [ ] 8.2 Run `git init && git add . && git commit -m "initial commit"`
- [ ] 8.3 Create GitHub repository and push code
- [ ] 8.4 Connect repo to Vercel at vercel.com
- [ ] 8.5 Add ANTHROPIC_API_KEY and OPENAI_API_KEY in Vercel env vars
- [ ] 8.6 Create Vercel Postgres database, copy DATABASE_URL
- [ ] 8.7 Change schema.prisma provider from "sqlite" to "postgresql"
- [ ] 8.8 Run `npx prisma generate` and push updated code
- [ ] 8.9 Verify app works on Vercel URL
- [ ] 8.10 Share URL with friends, have each one create their profile

---

## DONE 🎉
When all phases are complete:
- The app is live at a public URL
- Each friend has their own profile
- Max knows each person individually
- Every mistake is tracked with dates
- Reports are viewable and exportable
- Works on mobile and desktop
