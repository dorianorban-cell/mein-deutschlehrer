import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/lesson-types";
import type { LessonCategory } from "@/lib/lesson-types";

export interface WeaknessEntry {
  category: LessonCategory;
  categoryLabel: string;
  totalCount: number;
  topRule: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  // Group mistakes by category, sum counts
  const groups = await prisma.mistake.groupBy({
    by: ["category"],
    where: { profileId },
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
    take: 3,
  });

  // For each top category, get the most-repeated rule
  const result: WeaknessEntry[] = await Promise.all(
    groups.map(async (g) => {
      const top = await prisma.mistake.findFirst({
        where: { profileId, category: g.category },
        orderBy: { count: "desc" },
        select: { rule: true },
      });
      return {
        category: g.category as LessonCategory,
        categoryLabel: CATEGORY_LABELS[g.category as LessonCategory] ?? g.category,
        totalCount: g._sum.count ?? 0,
        topRule: top?.rule ?? "",
      };
    })
  );

  return NextResponse.json({ weaknesses: result });
}
