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

  return (
    <ConversationScreen
      profile={{
        id: profile.id,
        name: profile.name,
        level: profile.level,
        facts: profile.facts,
      }}
    />
  );
}
