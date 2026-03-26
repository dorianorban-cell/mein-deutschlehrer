import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { LessonCategory } from "@/lib/lesson-types";

export async function POST(request: Request) {
  const body = await request.json();
  const { profileId, category, score, total, usedPrompts } = body as {
    profileId: string;
    category: LessonCategory;
    score: number;
    total: number;
    usedPrompts?: string[];
  };

  if (!profileId || !category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // usedPrompts may not exist in DB if migration hasn't run — fall back gracefully
  try {
    await prisma.lessonAttempt.create({
      data: {
        profileId,
        category,
        score: score ?? 0,
        total: total ?? 0,
        usedPrompts: JSON.stringify(usedPrompts ?? []),
      },
    });
  } catch {
    await prisma.lessonAttempt.create({
      data: { profileId, category, score: score ?? 0, total: total ?? 0 },
    });
  }

  return NextResponse.json({ ok: true });
}
