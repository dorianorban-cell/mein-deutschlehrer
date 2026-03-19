import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/prompts";

interface Correction {
  original: string;
  corrected: string;
  rule: string;
  category: string;
}

function parseResponse(raw: string): {
  reply: string;
  corrections: Correction[];
  remember: string[];
} {
  let corrections: Correction[] = [];
  const correctionsMatch = raw.match(/<corrections>([\s\S]*?)<\/corrections>/);
  if (correctionsMatch) {
    try {
      corrections = JSON.parse(correctionsMatch[1].trim());
    } catch {
      corrections = [];
    }
  }

  const remember: string[] = [];
  const rememberRegex = /<remember>([\s\S]*?)<\/remember>/g;
  let match;
  while ((match = rememberRegex.exec(raw)) !== null) {
    remember.push(match[1].trim());
  }

  const reply = raw
    .replace(/<corrections>[\s\S]*?<\/corrections>/g, "")
    .replace(/<remember>[\s\S]*?<\/remember>/g, "")
    .trim();

  return { reply, corrections, remember };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { transcript, profileId, sessionId: incomingSessionId, lessonSystemOverride } = body as {
    transcript: string;
    profileId: string;
    sessionId?: string;
    lessonSystemOverride?: string;
  };

  if (!transcript?.trim() || !profileId) {
    return NextResponse.json({ error: "Missing transcript or profileId" }, { status: 400 });
  }

  // 1. Fetch profile (includes current facts)
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 2. Create or reuse session
  const session = incomingSessionId
    ? await prisma.session.findUnique({ where: { id: incomingSessionId } }) ??
      await prisma.session.create({ data: { profileId } })
    : await prisma.session.create({ data: { profileId } });

  const sessionId = session.id;

  // 3. Load prior conversation history for this session
  const history = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  // 4. Save the incoming user message
  await prisma.message.create({
    data: { profileId, sessionId, role: "user", content: transcript.trim() },
  });

  // 5. Build system prompt (use lesson override if in roleplay mode)
  const systemPrompt = lessonSystemOverride ?? buildSystemPrompt({
    name: profile.name,
    level: profile.level,
    facts: profile.facts,
  });

  // 6. Build full message history for Claude (history + new user message)
  const claudeMessages: Anthropic.Messages.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: transcript.trim() },
  ];

  // 7. Call Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const aiMessage = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const rawText =
    aiMessage.content[0].type === "text" ? aiMessage.content[0].text : "";

  // 8. Parse response
  const { reply, corrections, remember } = parseResponse(rawText);

  // 9–12. Persist assistant message, session timestamp, mistakes, and facts in parallel
  await Promise.all([
    // Save assistant reply
    prisma.message.create({
      data: { profileId, sessionId, role: "assistant", content: reply },
    }),

    // Update session endedAt
    prisma.session.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    }),

    // Save corrections with deduplication
    ...corrections.map(async (c) => {
      const existing = await prisma.mistake.findFirst({
        where: { profileId, original: c.original, corrected: c.corrected },
      });
      if (existing) {
        return prisma.mistake.update({
          where: { id: existing.id },
          data: { count: { increment: 1 }, lastSeen: new Date(), sessionId },
        });
      }
      return prisma.mistake.create({
        data: {
          profileId,
          sessionId,
          original: c.original,
          corrected: c.corrected,
          rule: c.rule,
          category: c.category,
        },
      });
    }),

    // Update profile facts if Claude remembered something new
    ...(remember.length > 0
      ? [
          (async () => {
            let existingFacts: string[] = [];
            try {
              existingFacts = JSON.parse(profile.facts);
            } catch {
              existingFacts = [];
            }
            const newFacts = [...existingFacts, ...remember];
            await prisma.profile.update({
              where: { id: profileId },
              data: { facts: JSON.stringify(newFacts) },
            });
          })(),
        ]
      : []),
  ]);

  return NextResponse.json({ reply, corrections, remember, sessionId });
}
