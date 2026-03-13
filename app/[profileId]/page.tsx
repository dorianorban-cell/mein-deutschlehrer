import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ConversationScreen from "@/components/ConversationScreen";

interface Props {
  params: Promise<{ profileId: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { profileId } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) notFound();

  const sessions = await prisma.session.findMany({
    where: { profileId },
    select: { startedAt: true },
  });

  // Compute streak: consecutive days with sessions going back from today
  const daySet = new Set(sessions.map((s) => s.startedAt.toDateString()));
  let streakDays = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daySet.has(d.toDateString())) {
      streakDays++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <ConversationScreen
      profile={{
        id: profile.id,
        name: profile.name,
        level: profile.level,
        facts: profile.facts,
        streakDays,
      }}
    />
  );
}
