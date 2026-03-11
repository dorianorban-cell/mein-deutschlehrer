# Mein Deutschlehrer — Architecture & Planning

## Core User Flow
1. User opens app → sees profile selector ("Wer bist du?")
2. Taps their name → enters their personal conversation screen
3. Presses and holds the voice button → speaks German
4. App sends audio to Whisper → gets transcript
5. Transcript sent to Claude with profile memory → gets response
6. Response parsed for corrections and memory updates
7. Clean response text sent to OpenAI TTS → audio plays back
8. Corrections saved to database silently in background
9. User can tap "Report" to see their full dated mistake history

## Multi-Profile Design
- No passwords, no logins
- Profile picker screen on load — large friendly cards
- Each profile has: name, level (A1-C1), facts (memory array), sessions, mistakes
- All data is completely separate per profile
- Optional PIN per profile can be added later (Phase 6+)

## Voice Pipeline (Critical Path)
```
Browser mic (MediaRecorder API)
    ↓ audio blob
POST /api/transcribe
    ↓ OpenAI Whisper whisper-1
    ↓ transcript text
POST /api/chat
    ↓ Claude Sonnet with system prompt + memory
    ↓ response text + <corrections> + <remember> tags
POST /api/speak
    ↓ OpenAI TTS tts-1 voice onyx
    ↓ audio stream
Browser plays audio
```

## Two-Pass Architecture
Every message triggers two operations:

**Pass 1 — Conversation (user-facing)**
- Claude generates natural German response
- Inline corrections shown in the conversation feed
- Audio played back via TTS

**Pass 2 — Silent Data Layer (background)**
- <corrections> JSON parsed and saved to Mistake table
- <remember> tags parsed and added to Profile.facts
- Session updated with endedAt timestamp

User never sees Pass 2. It just makes the system smarter over time.

## System Prompt Template
Built dynamically in lib/prompts.ts using profile data:

```
You are Max, a direct German language coach and genuine friend.
You are speaking with {name}, a {level} learner.

WHAT YOU KNOW ABOUT {name}:
{facts}

PERSONALITY: Direct, honest, no fluff. Correct mistakes immediately.
Genuinely interested in {name} — ask follow-up questions, remember
what they share, suggest interesting conversation topics.

LANGUAGE: 80% German, 20% English for grammar explanations only.
Push {name} toward complex structures appropriate for {level}.

CORRECTIONS: When {name} makes any grammar or vocabulary mistake:
❌ Du hast gesagt: [their version]
✅ Richtig: [corrected version]
💡 Warum: [grammar rule in one sentence]
Then continue naturally.

After every response append silently:
<corrections>[{"original":"...","corrected":"...","rule":"...","category":"..."}]</corrections>

If {name} shares a personal fact:
<remember>one-sentence fact about {name}</remember>

TOPICS: Daily life | Travel | Work | Relationships | Politics |
Philosophy | Film/music/art | Sports
```

## Mistake Report Design
Two views on the report page:

**By Category view:**
- Grouped by error type (word_order, case, gender, tense, vocab, etc.)
- Sorted by count descending
- Each entry: ❌ original | ✅ corrected | 💡 rule | 📅 dates | count
- Colour coded: red = 3+ times | yellow = 2 | grey = 1

**By Date view:**
- Reverse chronological session list
- Each session: date + mistakes made that day
- Each mistake tagged: 🆕 new OR ⚠️ recurring

## Database Schema
See prisma/schema.prisma for full schema.
Key relationships:
- Profile → many Sessions, Messages, Mistakes
- Session → many Mistakes
- Mistake has firstSeen + lastSeen + count for tracking recurrence

## Deployment Plan
- Local dev: SQLite (file:./dev.db)
- Production: Vercel + Vercel Postgres (free tier)
- One env var change: DATABASE_URL + schema provider = "postgresql"
- Auto-deploys from GitHub on every push

## Phase Completion Log
(Claude Code fills this in as each phase is completed)

- Phase 1 — Project Setup: [ complete ] — Next.js 16 (upgraded from 14 for Node 25 compat) + Tailwind scaffolded, Prisma 6 + SQLite schema pushed (Profile, Session, Message, Mistake), Prisma singleton in lib/db.ts, system prompt builder in lib/prompts.ts, dev server running on http://localhost:3000
- Phase 2 — Profile Selector: [ complete ] — "Wer bist du?" landing page with dark theme, GET+POST /api/profiles, ProfileSelector component with level-coloured cards, "+ Neues Profil" inline form (name + A1–C1 level), /[profileId] placeholder page, tested with 2 profiles
- Phase 3 — Voice Pipeline: [ complete ] — /api/transcribe (Whisper), /api/chat (Claude sonnet-4-20250514 + XML parsing), /api/speak (OpenAI TTS onyx), VoiceButton (hold-to-record, MediaRecorder, pointer+touch events), ConversationScreen (message feed, status dots, text fallback), conversation page with header. NOTE: Anthropic + OpenAI accounts need credits to activate live voice loop.
- Phase 4 — Corrections Display: [ complete ] — ConversationFeed (inline red-strikethrough→green corrections per message), MistakePanel (slide-in sidebar, category-coloured cards, count badge), TopicChips (8 scrollable topic pills), ConversationScreen wired to accumulate sessionCorrections and pass to both components. Compiles clean.
- Phase 5 — DB Persistence + Memory: [ complete ] — /api/chat now creates Session on first message (returns sessionId), saves user+assistant Messages, updates Session.endedAt, deduplicates Mistakes (increment count on same original→corrected pair), appends <remember> facts to Profile.facts JSON, passes full session history to Claude. ConversationScreen stores and forwards sessionId. Verified: Session + user Message written to SQLite before Claude call. NOTE: Full write path (assistant msg, mistakes, facts) activates once API credits added.
- Phase 6 — Mistake Report: [ complete ] — GET /api/report, report page at /[profileId]/report with German date header (Generiert/Tracking seit), ReportView client component with "Nach Kategorie" tab (grouped by category, count-sorted, red/yellow/grey left border) and "Nach Datum" tab (grouped by lastSeen day, 🆕/⚠️ badges), 📋 Kopieren button (markdown to clipboard), 📊 Report link in conversation header. Verified with 4 seeded test mistakes (3x/2x/1x/1x across 4 categories).
- Phase 7 — Mobile + Polish: [ complete ] — Viewport meta added (device-width, no zoom), emoji favicon (🎙️), voice button enlarged to w-24 h-24 on mobile (md:w-20 md:h-20 on desktop), iOS audio MIME type fixed (webm;codecs=opus → mp4 → ogg fallback chain), recording filename ext matches MIME type, header name truncated with max-w on small screens. MistakePanel mobile overlay was already implemented.
- Phase 8 — Deploy to Vercel: [ pending ]
