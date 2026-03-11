# Mein Deutschlehrer — Claude Code Instructions

## What This Project Is
A personal German language learning app with voice in/voice out.
Users speak German, get spoken responses back from an AI coach called Max.
Max corrects mistakes inline, remembers each user personally, and tracks
errors over time in a dated report.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (dark theme)
- Prisma + SQLite (local) → Postgres (production)
- OpenAI: whisper-1 (speech to text) + tts-1 voice onyx (text to speech)
- Anthropic: claude-sonnet-4-20250514 (conversation brain)

## How To Operate
- Always check TASKS.md before doing anything — work strictly in order
- Mark each task [x] in TASKS.md as soon as it is complete
- After completing each phase, summarise what was built in PLANNING.md
- Never skip a task — each one depends on the previous
- If something fails, fix it before moving to the next task
- Keep all code in TypeScript with proper types
- Mobile responsive layout at all times (Tailwind)
- Dark theme throughout

## Project Structure
```
mein-deutschlehrer/
├── app/
│   ├── page.tsx                    # Profile selector ("Wer bist du?")
│   ├── [profileId]/page.tsx        # Conversation screen per profile
│   ├── [profileId]/report/         # Mistake report per profile
│   └── api/
│       ├── transcribe/route.ts     # Audio → Whisper → text
│       ├── chat/route.ts           # Text → Claude → corrections
│       ├── speak/route.ts          # Text → OpenAI TTS → audio
│       ├── profiles/route.ts       # Create / list profiles
│       └── report/route.ts         # Mistake report data
├── components/
│   ├── ProfileSelector.tsx
│   ├── VoiceButton.tsx
│   ├── ConversationFeed.tsx
│   └── MistakePanel.tsx
├── lib/
│   ├── prompts.ts                  # System prompt builder
│   └── db.ts                       # Prisma client singleton
├── prisma/
│   └── schema.prisma
├── CLAUDE.md                       ← you are here
├── PLANNING.md                     ← architecture notes
├── TASKS.md                        ← task checklist
└── .env.local                      ← API keys (never commit this)
```

## Environment Variables Required
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DATABASE_URL="file:./dev.db"
```

## Key Rules
- NEVER commit .env.local to git
- NEVER put API keys anywhere except .env.local
- Always run `npx prisma db push` after changing schema.prisma
- Always test voice recording works on mobile before marking phase done
- The <corrections> and <remember> XML tags in Claude responses must
  always be parsed silently — never shown raw to the user
