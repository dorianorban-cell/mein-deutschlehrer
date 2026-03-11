import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { name: true, level: true, createdAt: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [mistakes, sessions] = await Promise.all([
    prisma.mistake.findMany({
      where: { profileId },
      orderBy: { count: "desc" },
    }),
    prisma.session.findMany({
      where: { profileId },
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, endedAt: true },
    }),
  ]);

  const totalOccurrences = mistakes.reduce((sum, m) => sum + m.count, 0);

  return NextResponse.json({ profile, mistakes, sessions, totalOccurrences });
}
