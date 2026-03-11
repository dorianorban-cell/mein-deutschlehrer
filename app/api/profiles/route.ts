import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, name: true, level: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, level } = body as { name: string; level: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: {
      name: name.trim(),
      level: level || "A1",
      facts: "[]",
    },
  });

  return NextResponse.json(profile, { status: 201 });
}
