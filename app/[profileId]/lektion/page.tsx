import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import LessonScreen from "@/components/LessonScreen";
import type { LessonCategory } from "@/lib/lesson-types";

interface Props {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ category?: string }>;
}

const VALID_CATEGORIES: LessonCategory[] = ["word_order", "case", "gender", "tense", "vocab"];

export default async function LektionPage({ params, searchParams }: Props) {
  const { profileId } = await params;
  const { category } = await searchParams;

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();

  const resolvedCategory: LessonCategory = VALID_CATEGORIES.includes(category as LessonCategory)
    ? (category as LessonCategory)
    : "word_order";

  return (
    <LessonScreen
      profile={{
        id: profile.id,
        name: profile.name,
        level: profile.level,
        facts: profile.facts,
      }}
      initialCategory={resolvedCategory}
    />
  );
}
