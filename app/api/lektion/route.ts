import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { buildLessonPrompt } from "@/lib/prompts";
import type { LessonCategory, LessonContent } from "@/lib/lesson-types";

export async function POST(request: Request) {
  const body = await request.json();
  const { profileId, category } = body as { profileId: string; category: LessonCategory };

  if (!profileId || !category) {
    return NextResponse.json({ error: "Missing profileId or category" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch up to 5 real mistakes for this category, most repeated first
  const mistakes = await prisma.mistake.findMany({
    where: { profileId, category },
    orderBy: { count: "desc" },
    take: 5,
    select: { original: true, corrected: true, rule: true, count: true, lastSeen: true },
  });

  const prompt = buildLessonPrompt(
    { name: profile.name, level: profile.level },
    category,
    mistakes
  );

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const tryGenerate = async (): Promise<LessonContent> => {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const match = raw.match(/<lesson>([\s\S]*?)<\/lesson>/);
    if (!match) throw new Error("No <lesson> block in response");
    return JSON.parse(match[1].trim()) as LessonContent;
  };

  try {
    const lesson = await tryGenerate();
    return NextResponse.json({ lesson });
  } catch {
    // Retry once
    try {
      const lesson = await tryGenerate();
      return NextResponse.json({ lesson });
    } catch (e) {
      return NextResponse.json({ error: "Failed to generate lesson", detail: String(e) }, { status: 500 });
    }
  }
}
