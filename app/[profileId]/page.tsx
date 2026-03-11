import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ConversationScreen from "@/components/ConversationScreen";

interface Props {
  params: Promise<{ profileId: string }>;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-900 text-emerald-300",
  A2: "bg-teal-900 text-teal-300",
  B1: "bg-blue-900 text-blue-300",
  B2: "bg-violet-900 text-violet-300",
  C1: "bg-rose-900 text-rose-300",
};

export default async function ProfilePage({ params }: Props) {
  const { profileId } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) notFound();

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Zurück
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-none">{profile.name}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              LEVEL_COLORS[profile.level] ?? "bg-gray-800 text-gray-400"
            }`}
          >
            {profile.level}
          </span>
        </div>
        <Link
          href={`/${profileId}/report`}
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          📊 Report
        </Link>
      </header>

      {/* Conversation screen fills the rest */}
      <ConversationScreen
        profile={{
          id: profile.id,
          name: profile.name,
          level: profile.level,
          facts: profile.facts,
        }}
      />
    </div>
  );
}
