import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { LessonCategory } from "@/lib/lesson-types";

export async function POST(request: Request) {
  const body = await request.json();
  const { profileId, category, score, total } = body as {
    profileId: string;
    category: LessonCategory;
    score: number;
    total: number;
  };

  if (!profileId || !category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.lessonAttempt.create({
    data: { profileId, category, score: score ?? 0, total: total ?? 0 },
  });

  return NextResponse.json({ ok: true });
}
