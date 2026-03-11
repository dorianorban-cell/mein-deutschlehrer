# Mein Deutschlehrer — Handoff Document

## What This App Is

A personal German language learning app. Users speak German; an AI coach called Max responds with spoken audio, corrects grammar mistakes inline, remembers personal facts, and tracks all errors in a dated report. Each user has their own persistent profile with no login required.

---

## Current State

**Phases 1–6 complete. App is fully functional locally. Blocked on API credits only.**

The entire feature set is built and wired end-to-end. The only reason it cannot be used right now is that both the Anthropic and OpenAI accounts associated with the API keys in `.env.local` have zero credit balance. Once topped up, everything activates with no code changes.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) — upgraded from 14 for Node.js 25 compat |
| Styling | Tailwind CSS, dark theme (`bg-gray-950`) throughout |
| Database | Prisma 6 + SQLite (`prisma/dev.db`) for local dev |
| AI (conversation) | Anthropic `claude-sonnet-4-20250514` |
| AI (speech-to-text) | OpenAI `whisper-1` |
| AI (text-to-speech) | OpenAI `tts-1`, voice `onyx` |

---

## File Map

```
mein-deutschlehrer/
├── app/
│   ├── layout.tsx                  Root layout — lang="de", dark bg, Geist font
│   ├── globals.css                 Tailwind directives + CSS variables
│   ├── page.tsx                    Profile selector ("Wer bist du?")
│   ├── [profileId]/
│   │   ├── page.tsx                Conversation screen per profile (+ 📊 Report link)
│   │   └── report/
│   │       └── page.tsx            Mistake report page (server component)
│   └── api/
│       ├── profiles/route.ts       GET list profiles | POST create profile
│       ├── transcribe/route.ts     POST audio blob → Whisper → { transcript }
│       ├── chat/route.ts           POST transcript → Claude → { reply, corrections, remember, sessionId }
│       ├── speak/route.ts          POST text → OpenAI TTS → audio/mpeg stream
│       └── report/route.ts         GET ?profileId → { profile, mistakes, sessions, totalOccurrences }
│
├── components/
│   ├── ProfileSelector.tsx         Profile cards grid + "Neues Profil" inline form
│   ├── ConversationScreen.tsx      Main orchestrator — state, pipeline, layout
│   ├── ConversationFeed.tsx        Message bubbles + inline correction blocks
│   ├── VoiceButton.tsx             Hold-to-record, MediaRecorder, pointer+touch
│   ├── MistakePanel.tsx            Slide-in sidebar, category cards, count badge
│   ├── TopicChips.tsx              8 scrollable German topic suggestion pills
│   └── ReportView.tsx              Two-tab report client component (category/date)
│
├── lib/
│   ├── db.ts                       Prisma client singleton (dev/prod safe)
│   └── prompts.ts                  buildSystemPrompt(profile) → Max's full persona
│
├── prisma/
│   ├── schema.prisma               Profile, Session, Message, Mistake models
│   └── dev.db                      SQLite database (3 profiles, 1 session, 1 message, 4 test mistakes seeded)
│
├── .env.local                      ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL
├── CLAUDE.md                       Claude Code operating instructions
├── PLANNING.md                     Architecture notes + phase completion log
├── TASKS.md                        Task checklist (Phases 1–6 complete)
└── HANDOFF.md                      This file
```

---

## How the Voice Pipeline Works

```
User holds VoiceButton → MediaRecorder captures audio
    ↓ release
POST /api/transcribe   (audio blob → OpenAI Whisper → transcript text)
    ↓
POST /api/chat         (transcript + profileId + sessionId → Claude)
    ├── Creates Session on first message, reuses on subsequent
    ├── Loads full conversation history from DB for context
    ├── Saves user Message to DB
    ├── Builds system prompt with profile.facts (persistent memory)
    ├── Calls Claude, parses <corrections> and <remember> XML tags
    ├── Saves assistant Message, updates Session.endedAt
    ├── Deduplicates Mistakes (increments count if same original→corrected)
    ├── Appends <remember> facts to Profile.facts JSON
    └── Returns { reply, corrections, remember, sessionId }
    ↓
POST /api/speak        (reply text → OpenAI TTS onyx → audio/mpeg)
    ↓
Browser plays audio
```

Text input bypasses /api/transcribe and goes straight to /api/chat.

---

## Key Design Decisions

- **XML tags from Claude** (`<corrections>`, `<remember>`) are silently stripped — never shown to user
- **Mistake deduplication**: matched on `(profileId, original, corrected)` — count increments, lastSeen updates
- **Session history**: all prior messages for the session are loaded from DB and passed to Claude on every call, giving it full conversational memory within a session
- **Profile facts**: persistent across sessions — loaded into every system prompt, appended after each `<remember>` tag
- **`sessionId` flow**: created server-side on first message, returned to frontend, forwarded on all subsequent messages
- **DB writes are parallel**: `Promise.all` for assistant message + session update + mistakes + facts

---

## Database Current State

- **Profile**: 3 rows (Anna/B1, Thomas/A2, and one more)
- **Session**: 1 row (from test — `endedAt` is null because Claude billing failed before the write)
- **Message**: 1 row (user message "Ich habe gestern ins Kino gegangen")
- **Mistake**: 4 rows (seeded for report testing: 3×/2×/1×/1× across tense/vocab/gender/word_order)

The `DATABASE_URL` in `.env.local` points to `prisma/dev.db` (SQLite).

---

## What Is NOT Working Yet (billing only)

- `/api/chat` → Anthropic returns `402 insufficient_credits`
- `/api/speak` → OpenAI returns `insufficient_quota`
- `/api/transcribe` → not yet tested (would fail at OpenAI too)

**Fix**: Add credits to both accounts. No code changes needed.

---

## What Phase 7 Needs To Do

### TASKS.md Phase 7 — Mobile + Polish

**7.1 Test on mobile browser**
Open `http://[your-local-ip]:3000` on a phone. The dev server already binds to `0.0.0.0` (check `npm run dev` output for the Network URL, e.g. `http://172.16.108.70:3000`).

**7.2 Fix layout issues on small screen**
Known areas to check:
- `ConversationScreen.tsx`: the `md:mr-72` class shifts the feed right when MistakePanel is open — on mobile the panel overlays instead, which is already coded, but verify it doesn't clip
- `ReportView.tsx`: mistake cards with long `original`/`corrected` strings use `truncate` — check they don't cut off mid-word in confusing ways on narrow screens
- `app/[profileId]/page.tsx` header: three items (← Zurück, name+badge, 📊 Report) — may need to shrink text or stack on very small screens

**7.3 Mistake panel mobile toggle — already implemented**
`MistakePanel.tsx` already has mobile backdrop overlay + `fixed` positioning. Verify it works on real device. The toggle button (clipboard icon) is in the input bar.

**7.4 Voice button size**
`VoiceButton.tsx` is currently `w-20 h-20` (80px). Confirm this is comfortable to press and hold on phone. May need to increase to `w-24 h-24` on mobile.

**7.5 Test voice recording on mobile Chrome and Safari**
- iOS Safari requires `audio/mp4` MIME type — `MediaRecorder.isTypeSupported('audio/webm')` returns false on iOS. The current fallback is `audio/ogg`, which also fails on iOS. **This needs a fix**: add `audio/mp4` as a fallback before `audio/ogg`.
- Android Chrome supports `audio/webm` fine.
- Fix in `VoiceButton.tsx` `startRecording()`:
  ```ts
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/mp4")
    ? "audio/mp4"
    : "audio/ogg";
  ```

**7.6 App title and favicon**
- Title is already set: `"Mein Deutschlehrer"` in `app/layout.tsx`
- Favicon: replace `app/favicon.ico` with a custom one (e.g. a 🇩🇪 or 🎙️ icon). Can use any favicon generator or just leave the default Next.js one for now.

---

## How to Resume

```bash
cd ~/mein-deutschlehrer
export PATH="/opt/homebrew/bin:$PATH"
npm run dev
# Server runs on http://localhost:3000
# Network URL shown in output (for mobile testing)
```

The dev server was last running when this handoff was written. If it's not running, start it with the above.

To run `prisma` commands, prefix with `DATABASE_URL="file:./prisma/dev.db"`:
```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma studio  # visual DB browser
DATABASE_URL="file:./prisma/dev.db" npx prisma db push  # after schema changes
```
